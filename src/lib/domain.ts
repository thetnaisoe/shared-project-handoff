export const JOB_STATUSES = [
  "Submitted", "Under Review", "Quoted", "Approved", "Scheduled", "In Progress", "Completed", "Rejected",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const SURFACE_OPTIONS = ["Smooth glass", "Compatible smooth façade", "Brick", "Concrete", "Other"];
export const DIRT_OPTIONS = ["Light", "Moderate", "Heavy", "Stubborn or attached dirt"];
export const ACCESS_OPTIONS = ["Easy lift access", "Restricted lift access", "Rope access required", "Difficult ground access", "Other"];
export const FREQUENCY_OPTIONS = ["One-off", "Annually", "Twice annually", "Quarterly", "Monthly"];

export const SUITABILITY = {
  SUITABLE: "SUITABLE FOR FURTHER REVIEW",
  MANUAL: "MANUAL ASSESSMENT REQUIRED",
  NOT: "NOT SUITABLE",
} as const;

export const eur = (n: number | null | undefined, digits = 0) =>
  n == null || Number.isNaN(n)
    ? "—"
    : new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: digits }).format(n);

export const compactEur = (n: number) => {
  if (Math.abs(n) >= 1e9) return `€${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `€${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `€${(n / 1e3).toFixed(0)}k`;
  return `€${n.toFixed(0)}`;
};

// ---------- Quotation ----------
export type QuoteInputs = {
  area: number;
  crewSize: number;
  workingDays: number;
  dailyRate: number;
  equipmentCosts: number;
  travelCosts: number;
  otherCosts: number;
  partnerMarginPct: number;
};

export function calculateQuote(i: QuoteInputs) {
  const operating = i.dailyRate * i.workingDays;
  const additional = i.equipmentCosts + i.travelCosts + i.otherCosts;
  const fassadexFee = operating + additional;
  const partnerMargin = fassadexFee * (i.partnerMarginPct / 100);
  const total = fassadexFee + partnerMargin;
  const perM2 = i.area > 0 ? total / i.area : 0;
  return { operating, additional, fassadexFee, partnerMargin, total, perM2, durationDays: i.workingDays };
}

export const REFERENCE_QUOTE: QuoteInputs = {
  area: 1500, crewSize: 3, workingDays: 3, dailyRate: 2500,
  equipmentCosts: 0, travelCosts: 0, otherCosts: 0, partnerMarginPct: 0,
};

// ---------- Market ----------
export type MarketInputs = { tam: number; suitabilityPct: number; capturePct: number };
export const DEFAULT_MARKET: MarketInputs = { tam: 5.8e9, suitabilityPct: 2.5, capturePct: (1.2 / 145) * 100 };
export function calculateMarket(m: MarketInputs) {
  const sam = m.tam * (m.suitabilityPct / 100);
  const som = sam * (m.capturePct / 100);
  return { tam: m.tam, sam, som };
}

// ---------- Readiness ----------
export type EvidenceLevel = "Validated" | "Partial" | "Assumed" | "Missing";
export const EVIDENCE_POINTS: Record<EvidenceLevel, number> = { Validated: 1, Partial: 0.5, Assumed: 0.2, Missing: 0 };
export const READINESS_DIMENSIONS = [
  { key: "customer", label: "Customer and partner validation", weight: 25 },
  { key: "technical", label: "Cleaning quality and technical feasibility", weight: 25 },
  { key: "operational", label: "Operational and regulatory readiness", weight: 20 },
  { key: "financial", label: "Financial viability", weight: 20 },
  { key: "competitive", label: "Competitive differentiation", weight: 10 },
] as const;
export type ReadinessKey = (typeof READINESS_DIMENSIONS)[number]["key"];

export function readinessScore(levels: Record<ReadinessKey, EvidenceLevel>) {
  const parts = READINESS_DIMENSIONS.map((d) => ({
    ...d,
    level: levels[d.key],
    points: Math.round(d.weight * EVIDENCE_POINTS[levels[d.key]] * 10) / 10,
  }));
  const total = Math.round(parts.reduce((s, p) => s + p.points, 0));
  return { total, parts };
}
