import { describe, it, expect } from "vitest";
import { financialEstimate, scoreReadiness, EMPTY_READINESS, DIMENSIONS, safeAnalysis, analysisSchema, submissionInput, submissionSchema } from "./domain";
describe("Two-field invention submission", () => {
  it("accepts only invention description and problem without additional answers", () => {
    const input = submissionInput({ technical_description: "Reusable fibre packaging", problem_statement: "Single-use packaging creates waste" });
    expect(input.invention_name).toBe("Reusable fibre packaging");
    expect(input.technical_description).toBe("Reusable fibre packaging");
    expect(input.problem_statement).toBe("Single-use packaging creates waste");
    expect(input.research_consent).toBe(false);
  });
  it("requires the invention description", () => expect(submissionSchema.safeParse({technical_description:" ",problem_statement:"Waste"}).success).toBe(false));
  it("requires the problem being solved", () => expect(submissionSchema.safeParse({technical_description:"Packaging",problem_statement:" "}).success).toBe(false));
});
describe("Lab2Market financial rules", () => {
  const f = { productionCost: 20, otherVariableCosts: 5, sellingPrice: 50, monthlyVolume: 100, fixedCosts: 1000, investment: 6000 };
  it("subtracts all variable unit costs", () => expect(financialEstimate(f).grossProfit).toBe(25));
  it("calculates gross margin", () => expect(financialEstimate(f).grossMargin).toBe(50));
  it("calculates monthly revenue", () => expect(financialEstimate(f).revenue).toBe(5000));
  it("subtracts variable and fixed costs", () => expect(financialEstimate(f).operatingProfit).toBe(1500));
  it("calculates break even units", () => expect(financialEstimate(f).breakEven).toBe(40));
  it("calculates positive-profit payback", () => expect(financialEstimate(f).payback).toBe(4));
  it("does not show payback for a loss", () => expect(financialEstimate({ ...f, fixedCosts: 10000 }).payback).toBeNull());
  it("does not divide by zero or negative contribution", () => expect(financialEstimate({ ...f, sellingPrice: 0 }).breakEven).toBeNull());
});
describe("Evidence maturity", () => {
  it("uses PRD dimension weights", () => expect(DIMENSIONS.map(d => d.weight)).toEqual([25,25,15,20,15]));
  it("gives no points for missing evidence", () => expect(scoreReadiness(EMPTY_READINESS).total).toBe(0));
  it("does not give full points to unsupported assumptions", () => expect(scoreReadiness({ market: "Assumed", customer: "Assumed", competitive: "Assumed", technical: "Assumed", financial: "Assumed" }).total).toBe(20));
  it.each([[38,"Early Exploration"],[40,"Opportunity Under Investigation"],[60,"Validation in Progress"],[80,"Stronger Commercial Evidence"]])("applies the %s threshold", (n,label) => {
    const levels = n === 38 ? { market: "Validated",customer:"Missing",competitive:"Missing",technical:"Partial",financial:"Assumed" } : n === 40 ? {market:"Validated",customer:"Missing",competitive:"Validated",technical:"Missing",financial:"Missing"} : n === 60 ? {market:"Validated",customer:"Missing",competitive:"Validated",technical:"Validated",financial:"Missing"} : {market:"Validated",customer:"Validated",competitive:"Validated",technical:"Missing",financial:"Validated"};
    const score = scoreReadiness(levels as Parameters<typeof scoreReadiness>[0]);
    expect(score.total).toBe(n);
    expect(score.label).toBe(label);
  });
  it("downgrades unverified AI facts", () => {
    const a = analysisSchema.parse({executive_summary:"",technology:"",problem:"",solution:"",applications:[],customers:[],opportunities:[],competitors:[],evidence:[{claim:"Unverified",classification:"FACT",explanation:"",source_url:"https://example.com",methodology:"",confidence:"HIGH"}],risks:[],experiments:[],next_steps:[],limitations:[],research_summary:""});
    expect(safeAnalysis(a).evidence[0]?.classification).toBe("ASSUMPTION");
  });
});