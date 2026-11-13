export type EmbeddingConfig = {
  baseURL: string;
  apiKey: string;
  model: string;
  dimensions?: number;
};
export type Tokenizer = { encode: (text: string) => readonly number[] };
export class EmbeddingFailure extends Error {
  constructor(message: string, public status: number) { super(message); }
}
// UTF-8 bytes conservatively upper-bound text tokens; small byte budgets avoid
// relying on a different model's tokenizer or silently truncating documents.
export const conservativeTokenizer: Tokenizer = { encode: text => Array.from(new TextEncoder().encode(text)) };

export function chunkDocument(text: string, tokenizer: Tokenizer, maxTokens: number, overlap = 0): string[] {
  if (
    !Number.isInteger(maxTokens) ||
    maxTokens < 1 ||
    !Number.isInteger(overlap) ||
    overlap < 0 ||
    overlap >= maxTokens
  ) {
    throw new Error("Invalid chunk budget");
  }
  const points = Array.from(text);
  const chunks: string[] = [];
  let start = 0;
  while (start < points.length) {
    let low = start + 1;
    let high = points.length;
    let end = start;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      if (tokenizer.encode(points.slice(start, middle).join("")).length <= maxTokens) {
        end = middle;
        low = middle + 1;
      } else high = middle - 1;
    }
    if (end === start) throw new Error("Chunk budget cannot hold one Unicode code point");
    chunks.push(points.slice(start, end).join(""));
    if (end === points.length) break;
    let next = end;
    while (next > start + 1 && tokenizer.encode(points.slice(next - 1, end).join("")).length <= overlap) next--;
    start = next;
  }
  return chunks;
}

async function postEmbeddings(config: EmbeddingConfig, input: readonly string[], maxAttempts = 4) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${config.baseURL}/v1/embeddings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        input,
        ...(config.dimensions === undefined ? {} : { dimensions: config.dimensions }),
      }),
    });
    const retryable = response.status === 429 || response.status >= 500;
    if (response.ok || !retryable || attempt === maxAttempts) return response;
    await response.body?.cancel();
    const retryAfterSeconds = Number(response.headers.get("Retry-After"));
    const delayMs = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 1000 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delayMs + Math.random() * 1000));
  }
}

export async function embedChunks(
  config: EmbeddingConfig,
  chunks: readonly string[],
  countTokens: (text: string) => number,
  limits: { maxInputTokens: number; maxBatchTokens: number; maxBatchItems: number },
) {
  for (const limit of Object.values(limits))
    if (!Number.isInteger(limit) || limit < 1) throw new Error("Invalid embedding limit");
  const vectors: number[][] = [];
  let batch: string[] = [];
  let tokens = 0;
  const flush = async () => {
    if (!batch.length) return;
    const response = await postEmbeddings(config, batch);
    if (!response.ok) {
      const body = await response.json().catch(() => null) as {message?:string;error?:{message?:string}} | null;
      throw new EmbeddingFailure(body?.message ?? body?.error?.message ?? `Market-data indexing failed (${response.status}).`, response.status);
    }
    const result = (await response.json()) as { data: { index: number; embedding: number[] }[] };
    const ordered: (number[] | undefined)[] = Array.from({ length: batch.length });
    for (const item of result.data) {
      if (
        !Number.isInteger(item.index) ||
        item.index < 0 ||
        item.index >= batch.length ||
        ordered[item.index] ||
        item.embedding.length !== 3072 || item.embedding.some(value => !Number.isFinite(value))
      ) {
        throw new Error("Invalid embedding response index or vector");
      }
      ordered[item.index] = item.embedding;
    }
    for (const vector of ordered) {
      if (!vector) throw new Error("Missing embedding result");
      vectors.push(vector);
    }
    batch = [];
    tokens = 0;
  };
  for (const chunk of chunks) {
    const size = countTokens(chunk);
    if (
      !chunk.trim() ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > limits.maxInputTokens ||
      size > limits.maxBatchTokens
    ) {
      throw new Error("Split oversized or empty embedding input before batching");
    }
    if (batch.length >= limits.maxBatchItems || tokens + size > limits.maxBatchTokens) await flush();
    batch.push(chunk);
    tokens += size;
  }
  await flush();
  return vectors;
}
