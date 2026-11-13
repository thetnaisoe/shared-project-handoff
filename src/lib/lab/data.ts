import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { analysisSchema, EMPTY_FINANCES, EMPTY_READINESS, type Finances, type Readiness } from "./domain";
export type Project = Database["public"]["Tables"]["invention_projects"]["Row"];
export const asJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Json;
export const projectsQuery = queryOptions({ queryKey: ["invention-projects"], queryFn: async () => { const { data, error } = await supabase.from("invention_projects").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
export const demoQuery = queryOptions({ queryKey: ["invention-demo"], queryFn: async () => { const { data, error } = await supabase.from("invention_demo_templates").select("*").eq("id", "facade-drone").single(); if (error) throw error; return data; } });
export function getAnalysis(p: Project) { const parsed = analysisSchema.safeParse(p.analysis); return parsed.success ? parsed.data : null; }
export function getReadiness(p: Project): Readiness { return { ...EMPTY_READINESS, ...(p.readiness as Partial<Readiness>) }; }
export function getFinances(p: Project): Finances { return { ...EMPTY_FINANCES, ...(p.finances as Partial<Finances>) }; }