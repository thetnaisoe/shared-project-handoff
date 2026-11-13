import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const assessmentSchema = z.object({
  suitability_result: z.enum(["SUITABLE FOR FURTHER REVIEW", "MANUAL ASSESSMENT REQUIRED", "NOT SUITABLE"]),
  overview: z.string(),
  surface: z.string(),
  access: z.string(),
  dirt: z.string(),
  site_value: z.string(),
  benefits: z.array(z.string()),
  risks: z.array(z.string()),
  missing: z.array(z.string()),
  recommendations: z.array(z.string()),
});

const ASSESS_INSTRUCTIONS = `You are the site-qualification analyst for FASSADEX, a specialist drone façade-cleaning operator that partners with commercial cleaning companies.
Assess a building against four criteria:
1. Surface: glass or compatible smooth façade.
2. Access: conventional lifts or rope access are difficult or disruptive.
3. Soiling: spray cleaning is NOT expected to be sufficient for hard or attached dirt (heavy/stubborn dirt lowers suitability).
4. Site and value: safe access, flight permissions and commercially viable pricing.
Return exactly one outcome: "SUITABLE FOR FURTHER REVIEW", "MANUAL ASSESSMENT REQUIRED" or "NOT SUITABLE".
Never treat your result as flight authorisation or a guarantee of cleaning quality. Recommendations must always include qualified operator approval, site inspection, regulatory compliance and safety assessment. Be concise: each text field 1-3 sentences, each list 2-5 short items. Do not invent facts not in the input; list them under missing.`;

export const assessBuilding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { buildingId: string; jobId: string | null }) =>
    z.object({ buildingId: z.string().uuid(), jobId: z.string().uuid().nullable() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: b, error } = await supabase.from("buildings").select("*").eq("id", data.buildingId).single();
    if (error || !b) throw new Error("Building not found");
    const { aiObject } = await import("./ai.server");
    const r = await aiObject(
      assessmentSchema,
      ASSESS_INSTRUCTIONS,
      `Building data:\n${JSON.stringify({
        name: b.name, city: b.city, height_m: b.height, exterior_area_m2: b.exterior_area, floors: b.floors,
        surface: b.surface_type, dirt: b.dirt_condition, access: b.access_constraints, frequency: b.cleaning_frequency,
        existing_method: b.existing_method, notes: b.site_notes, budget_eur: b.customer_budget,
      })}`,
    );
    const { data: saved, error: insErr } = await supabase
      .from("assessments")
      .insert({
        building_id: b.id,
        job_id: data.jobId,
        suitability_result: r.suitability_result,
        analysis: { overview: r.overview, surface: r.surface, access: r.access, dirt: r.dirt, site_value: r.site_value, benefits: r.benefits, missing: r.missing },
        risks: r.risks,
        recommendations: r.recommendations,
      })
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);
    if (data.jobId) {
      const { data: job } = await supabase.from("jobs").select("status").eq("id", data.jobId).single();
      if (job?.status === "Submitted") {
        await supabase.from("jobs").update({ status: "Under Review" }).eq("id", data.jobId);
        await supabase.from("job_events").insert({ job_id: data.jobId, from_status: "Submitted", to_status: "Under Review", note: `AI assessment: ${r.suitability_result}` });
      }
    }
    return saved;
  });

export const explainQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { inputs: Record<string, number>; results: Record<string, number>; context: string }) =>
    z.object({ inputs: z.record(z.string(), z.number()), results: z.record(z.string(), z.number()), context: z.string().max(2000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { aiText } = await import("./ai.server");
    const text = await aiText(
      `You explain drone façade-cleaning quotations for FASSADEX. Explain how the price was built from the inputs, then list factors that may increase and factors that may decrease the final cost. Never invent actual operating costs or profit margins; reference values are one-building assumptions, not validated national averages. Use short markdown-free plain text with simple "-" bullet lines. Max 220 words.`,
      `Context: ${data.context}\nInputs: ${JSON.stringify(data.inputs)}\nCalculated: ${JSON.stringify(data.results)}`,
    );
    return { text };
  });
