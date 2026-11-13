import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { embedChunks, conservativeTokenizer,chunkDocument } from "./embeddings.server";
import { relevantSources } from "./market-domain";
export async function marketEmbeddings(texts: string[]) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for market-data indexing.");
  return embedChunks({baseURL:"https://ai.gateway.lovable.dev",apiKey,model:"google/gemini-embedding-2"},texts,text=>conservativeTokenizer.encode(text).length,{maxInputTokens:8192,maxBatchTokens:80000,maxBatchItems:100});
}
export async function assertMarketAccess(client: SupabaseClient<Database>) {
  const {data,error} = await client.from("market_ai_access").select("message").maybeSingle();
  if (error) throw error;
  if (data) throw new Error(data.message);
}
export async function persistMarketBlock(client: SupabaseClient<Database>, error: unknown) {
  const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 0;
  if (![402,403].includes(status)) return;
  const message = error instanceof Error ? error.message : "AI access is paused until it is restored.";
  const { error: saveError } = await client.from("market_ai_access").insert({message,status});
  if (saveError && saveError.code !== "23505") throw saveError;
}
export async function retrieveMarketData(client: SupabaseClient<Database>, query: string) {
  await assertMarketAccess(client);
  const {count,error} = await client.from("market_documents").select("id",{count:"exact",head:true});
  if (error) throw error;
  if (!count) return [];
  try {
    const vectors = await marketEmbeddings(chunkDocument(query,conservativeTokenizer,2400,0));
    const first = vectors[0];
    const vector = first?.map((_,index)=>vectors.reduce((sum,v)=>sum+(v[index]??0),0)/vectors.length);
    if (!vector) throw new Error("No market-query embedding returned.");
    const {data,error:matchError} = await client.rpc("match_market_chunks",{query_embedding:JSON.stringify(vector),match_count:6});
    if (matchError) throw matchError;
    return relevantSources(data ?? []);
  } catch(error) { await persistMarketBlock(client,error); throw error; }
}