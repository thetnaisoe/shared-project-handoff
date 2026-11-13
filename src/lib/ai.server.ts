import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError } from "ai";
import type { z } from "zod";

const RUN_ID = "X-Lovable-AIG-Run-ID";
const MODEL = "openai/gpt-6-astra";

function provider() {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured (missing key).");
  let runId: string | undefined;
  return createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set(RUN_ID, runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get(RUN_ID) ?? undefined;
      if (!res.ok) {
        const body = await res.clone().text().catch(() => "");
        if (res.status === 402) throw new Error("AI credits are exhausted. Add credits in Settings → Plans & credits.");
        if (res.status === 429) throw new Error("AI is busy right now. Please try again in a minute.");
        if (res.status === 403) throw new Error("AI access is blocked for this workspace.");
        console.error("AI gateway error", res.status, body.slice(0, 300));
      }
      return res;
    },
  });
}

const opts = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

export async function aiObject<T extends z.ZodType>(schema: T, instructions: string, prompt: string): Promise<z.infer<T>> {
  const result = streamText({
    model: provider().responses(MODEL),
    instructions,
    prompt,
    output: Output.object({ schema }),
    providerOptions: opts,
  });
  try {
    return (await result.output) as z.infer<T>;
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) throw new Error("The AI returned an incomplete answer. Please try again.");
    throw e;
  }
}

export async function aiText(instructions: string, prompt: string): Promise<string> {
  const result = streamText({ model: provider().responses(MODEL), instructions, prompt, providerOptions: opts });
  return await result.text;
}
