import { describe, it, expect } from "vitest";
import { calculateQuote, REFERENCE_QUOTE, calculateMarket, DEFAULT_MARKET, readinessScore } from "./domain";

describe("quotation", () => {
  it("reference building: €2,500/day × 3 days = €7,500 at €5/m²", () => {
    const q = calculateQuote(REFERENCE_QUOTE);
    expect(q.total).toBe(7500);
    expect(q.perM2).toBe(5);
  });
  it("partner margin is added on top of the Fassadex fee", () => {
    const q = calculateQuote({ ...REFERENCE_QUOTE, travelCosts: 500, partnerMarginPct: 10 });
    expect(q.fassadexFee).toBe(8000);
    expect(q.partnerMargin).toBe(800);
    expect(q.total).toBe(8800);
  });
});

describe("market", () => {
  it("defaults reproduce €145M SAM and €1.2M SOM", () => {
    const m = calculateMarket(DEFAULT_MARKET);
    expect(m.sam).toBeCloseTo(145e6);
    expect(m.som).toBeCloseTo(1.2e6);
  });
});

describe("readiness", () => {
  it("missing evidence earns no points; all validated = 100", () => {
    const all = { customer: "Validated", technical: "Validated", operational: "Validated", financial: "Validated", competitive: "Validated" } as const;
    expect(readinessScore(all).total).toBe(100);
    expect(readinessScore({ ...all, customer: "Missing" }).total).toBe(75);
  });
});
