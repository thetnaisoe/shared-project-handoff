import { describe,it,expect } from "vitest";
import { marketDocumentSchema,relevantSources,sourceContext } from "./market-domain";
import { chunkDocument,conservativeTokenizer,embedChunks,EmbeddingFailure } from "./embeddings.server";
import { vi } from "vitest";
describe("Market data retrieval",()=>{
  it("rejects executable source links",()=>expect(marketDocumentSchema.safeParse({title:"Report",content:"Demand data",source_url:"javascript:alert(1)"}).success).toBe(false));
  it("excludes unrelated excerpts",()=>expect(relevantSources([{id:"1",document_id:"1",title:"Other",source_url:null,content:"Other industry",similarity:0.1}])).toEqual([]));
  it("states the absence of supplied evidence",()=>expect(sourceContext([])).toContain("No relevant supplied market data"));
  it("keeps the complete input across bounded chunks",()=>{
    const text="Market 😀 demand ".repeat(400);
    const chunks=chunkDocument(text,conservativeTokenizer,2400,0);
    expect(chunks.join("")).toBe(text);
    expect(chunks.every(c=>conservativeTokenizer.encode(c).length<=2400)).toBe(true);
  });
  it("aligns embedding vectors by response index",async()=>{
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({data:[{index:1,embedding:Array(3072).fill(2)},{index:0,embedding:Array(3072).fill(1)}]}))));
    try { const vectors=await embedChunks({baseURL:"https://example.test",apiKey:"test",model:"google/gemini-embedding-2"},["one","two"],t=>t.length,{maxInputTokens:8192,maxBatchTokens:80000,maxBatchItems:100});expect(vectors[0]?.[0]).toBe(1);expect(vectors[1]?.[0]).toBe(2); } finally {vi.unstubAllGlobals();}
  });
  it("does not retry a provider denial",async()=>{
    const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({message:"Access denied"}),{status:403}));vi.stubGlobal("fetch",fetchMock);
    try {await expect(embedChunks({baseURL:"https://example.test",apiKey:"test",model:"google/gemini-embedding-2"},["data"],t=>t.length,{maxInputTokens:8192,maxBatchTokens:80000,maxBatchItems:100})).rejects.toBeInstanceOf(EmbeddingFailure);expect(fetchMock).toHaveBeenCalledTimes(1);} finally {vi.unstubAllGlobals();}
  });
});