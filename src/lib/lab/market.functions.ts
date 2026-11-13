import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { marketDocumentSchema } from "./market-domain";
export const ingestMarketDocument = createServerFn({method:"POST"})
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => marketDocumentSchema.parse(data))
  .handler(async ({data,context}) => {
    const {supabase} = context;
    const {marketEmbeddings,assertMarketAccess,persistMarketBlock} = await import("./market.server");
    const {chunkDocument,conservativeTokenizer} = await import("./embeddings.server");
    await assertMarketAccess(supabase);
    try {
      const {data:duplicate,error:duplicateError} = await supabase.from("market_documents").select("id,content").eq("title",data.title);
      if (duplicateError) throw duplicateError;
      if (duplicate?.some(d=>d.content===data.content)) throw new Error("This market document is already indexed.");
      const chunks = chunkDocument(data.content,conservativeTokenizer,2400,160);
      const vectors = await marketEmbeddings(chunks);
      const {data:doc,error} = await supabase.from("market_documents").insert({...data,source_url:data.source_url||null}).select("id").single();
      if (error || !doc) throw error ?? new Error("Unable to save market document.");
      const {error:chunkError} = await supabase.from("market_chunks").insert(chunks.map((content,index)=>({document_id:doc.id,chunk_index:index,content,embedding:JSON.stringify(vectors[index]),embedding_model:"google/gemini-embedding-2"})));
      if (chunkError) { await supabase.from("market_documents").delete().eq("id",doc.id); throw chunkError; }
      return {id:doc.id,chunks:chunks.length};
    } catch(error) { await persistMarketBlock(supabase,error); throw error; }
  });