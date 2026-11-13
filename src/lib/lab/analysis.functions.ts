import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { inventionSchema, EMPTY_READINESS } from "./domain";
import type { Json } from "@/integrations/supabase/types";
const asJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Json;

export const analyseInvention = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data)).handler(async ({ data, context }) => {
  const { supabase } = context;
  const { data: project, error } = await supabase.from("invention_projects").select("*").eq("id", data.id).single();
  if (error || !project) throw new Error("Project not found.");
  if (project.status === "Blocked") return { ok: false, error: project.error_message || "AI access must be restored before starting a new request." };
  const { analyse, GatewayFailure } = await import("./analysis.server");
  const {retrieveMarketData,persistMarketBlock} = await import("./market.server");
  try {
    const input = inventionSchema.parse({ ...(project.inputs as object), invention_name: project.invention_name });
    const {error:stageError} = await supabase.from("invention_projects").update({status:"Researching Market",error_message:null}).eq("id",data.id);
    if (stageError) throw stageError;
    const sources = await retrieveMarketData(supabase,`${input.technical_description}\n${input.problem_statement}`);
    const analysis = await analyse(input, async status => { const { error: updateError } = await supabase.from("invention_projects").update({ status, error_message: null }).eq("id", data.id); if (updateError) throw updateError; }, sources);
    const readiness = { ...EMPTY_READINESS, market: "Assumed", customer: "Assumed", technical: input.evidence ? "Partial" : "Assumed", financial: "Assumed" };
    const { error: saveError } = await supabase.from("invention_projects").update({ analysis: asJson(analysis), readiness: asJson(readiness), status: "Completed", error_message: null }).eq("id", data.id);
    if (saveError) throw saveError;
    return { ok: true, error: null };
  } catch (e) {
    await persistMarketBlock(supabase,e);
    const message = e instanceof Error ? e.message : "Analysis failed. Your invention is saved.";
    const blocked = e instanceof GatewayFailure && [402,403].includes(e.status);
    await supabase.from("invention_projects").update({ status: blocked ? "Blocked" : "Failed", error_message: message }).eq("id", data.id);
    return { ok: false, error: message };
  }
});