import { z } from "zod";

export const STAGES = ["Research Concept", "Laboratory Prototype", "Proof of Concept", "Tested Prototype", "Pilot Tested", "Ready for Commercialisation"] as const;
const text = z.string().trim().min(1).max(12000);
export const submissionSchema = z.object({ technical_description: text, problem_statement: text });
export function submissionInput(value: unknown) {
  const fields = submissionSchema.parse(value);
  return inventionSchema.parse({ ...fields, invention_name: fields.technical_description.split(/\n|[.!?]/)[0]?.trim().slice(0, 100) || "Untitled invention" });
}
export const inventionSchema = z.object({ invention_name: text.max(160), technical_description: text, problem_statement: text, proposed_solution: z.string().max(12000).default(""), innovation_advantage: z.string().max(12000).default(""), development_stage: z.enum(STAGES).default("Research Concept"), target_industry: z.string().max(300).default(""), target_geography: z.string().max(300).default(""), potential_customers: z.string().max(2000).default(""), known_applications: z.string().max(2000).default(""), evidence: z.string().max(12000).default(""), development_budget: z.number().min(0).default(0), additional_information: z.string().max(12000).default(""), research_consent: z.boolean().default(false) });
export type InventionInput = z.infer<typeof inventionSchema>;
const level = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const analysisSchema = z.object({
  executive_summary: z.string(), technology: z.string(), problem: z.string(), solution: z.string(), applications: z.array(z.string()), customers: z.array(z.string()), opportunities: z.array(z.string()),
  competitors: z.array(z.object({ name: z.string(), solution: z.string(), strengths: z.array(z.string()), weaknesses: z.array(z.string()), differentiation: z.string(), source_url: z.string().nullable() })),
  evidence: z.array(z.object({ claim: z.string(), classification: z.enum(["FACT", "ESTIMATE", "ASSUMPTION"]), explanation: z.string(), source_url: z.string().nullable(), methodology: z.string(), confidence: level })),
  risks: z.array(z.object({ title: z.string(), description: z.string(), category: z.string(), impact: level, uncertainty: level, risk_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]), evidence_strength: level, recommended_experiment: z.string() })),
  experiments: z.array(z.object({ title: z.string(), assumption: z.string(), objective: z.string(), methodology: z.array(z.string()), participants: z.string(), sample_size: z.string(), resources: z.string(), duration: z.string(), estimated_cost: z.number().nullable(), success_criteria: z.string(), failure_criteria: z.string(), learning: z.string() })),
  next_steps: z.array(z.string()), limitations: z.array(z.string()), research_summary: z.string(),
  market_sources: z.array(z.object({ id: z.string(), document_id: z.string(), title: z.string(), source_url: z.string().nullable(), content: z.string(), similarity: z.number() })).default([]),
});
export type Analysis = z.infer<typeof analysisSchema>;
export const DIMENSIONS = [{ key: "market", label: "Market evidence", weight: 25 }, { key: "customer", label: "Customer validation", weight: 25 }, { key: "competitive", label: "Competitive differentiation", weight: 15 }, { key: "technical", label: "Technical & manufacturing", weight: 20 }, { key: "financial", label: "Financial feasibility", weight: 15 }] as const;
export type Maturity = "Missing" | "Assumed" | "Partial" | "Validated";
export type Readiness = Record<(typeof DIMENSIONS)[number]["key"], Maturity>;
export const EMPTY_READINESS: Readiness = { market: "Missing", customer: "Missing", competitive: "Missing", technical: "Missing", financial: "Missing" };
export function scoreReadiness(levels: Readiness) {
  const fractions = { Missing: 0, Assumed: 0.2, Partial: 0.5, Validated: 1 };
  const parts = DIMENSIONS.map(d => ({ ...d, level: levels[d.key], points: d.weight * (fractions[levels[d.key]] ?? 0) }));
  const total = Math.round(parts.reduce((s, p) => s + p.points, 0));
  return { total, parts, label: total < 40 ? "Early Exploration" : total < 60 ? "Opportunity Under Investigation" : total < 80 ? "Validation in Progress" : "Stronger Commercial Evidence" };
}
export type Finances = { productionCost: number; sellingPrice: number; monthlyVolume: number; fixedCosts: number; investment: number; otherVariableCosts: number };
export const EMPTY_FINANCES: Finances = { productionCost: 0, sellingPrice: 0, monthlyVolume: 0, fixedCosts: 0, investment: 0, otherVariableCosts: 0 };
export function financialEstimate(f: Finances) {
  const variableCost = f.productionCost + f.otherVariableCosts;
  const grossProfit = f.sellingPrice - variableCost;
  const revenue = f.sellingPrice * f.monthlyVolume;
  const operatingProfit = revenue - variableCost * f.monthlyVolume - f.fixedCosts;
  return { variableCost, grossProfit, grossMargin: f.sellingPrice > 0 ? grossProfit / f.sellingPrice * 100 : null, revenue, operatingProfit, breakEven: grossProfit > 0 ? Math.ceil(f.fixedCosts / grossProfit) : null, payback: operatingProfit > 0 ? f.investment / operatingProfit : null };
}
export function safeAnalysis(a: Analysis): Analysis {
  // Search answer links are model output, not native verified citations.
  return { ...a, evidence: a.evidence.map(e => ({ ...e, classification: e.classification === "FACT" ? "ASSUMPTION" : e.classification, source_url: null })), competitors: a.competitors.map(c => ({ ...c, source_url: null })), limitations: [...a.limitations, "Search summaries and links are not independently verified; unsupported claims remain assumptions."] };
}