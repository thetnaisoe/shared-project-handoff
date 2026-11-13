import { z } from "zod";
export const marketDocumentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  source_url: z.union([z.literal(""), z.url().refine(url => /^https?:\/\//.test(url), "Use an HTTP or HTTPS source link")]).default(""),
  content: z.string().trim().min(1).max(60000),
});
export type MarketSource = { id: string; document_id: string; title: string; source_url: string | null; content: string; similarity: number };
export function relevantSources(sources: MarketSource[]) {
  return sources.filter(s => s.similarity >= 0.35).slice(0, 6);
}
export function sourceContext(sources: MarketSource[]) {
  return sources.length ? JSON.stringify(sources.map(({id,title,content}) => ({source_id:id,title,excerpt:content}))) : "No relevant supplied market data was found. State that evidence is missing; do not invent market figures.";
}