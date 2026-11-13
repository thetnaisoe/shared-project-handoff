import { describe, expect, it } from "vitest";
import type { Experiment } from "@/lib/contract";
import { buildGate2Decisions, draftFromExperiment } from "./experiment-decisions";

const experiment: Experiment = {
  id: "x1",
  run_id: "run1",
  assumption_id: "c1",
  hypothesis: "Original hypothesis",
  method: "customer_interviews",
  metric: "Original metric",
  rule: { trials: 10, pass_at_least: 5, fail_below: 3, on_fail: "pivot" },
  pass_threshold: "5 or more of 10",
  kill_criterion: "Fewer than 3 of 10 → pivot",
  effort_days: 7,
  cost_eur: 150,
  updates_claim_ids: ["c1"],
  priority: 1,
  status: "proposed",
  locked_at: null,
  successes: 0,
  trials_done: 0,
  outcome: "pending",
  decision_flip_prob: 0.25,
  rank: 1,
};

describe("buildGate2Decisions", () => {
  it("sends only the experiment id for accept and reject decisions", () => {
    expect(
      buildGate2Decisions(
        [experiment, { ...experiment, id: "x2" }],
        { x1: "accept", x2: "reject" },
        {},
      ),
    ).toEqual([
      { experiment_id: "x1", decision: "accept" },
      { experiment_id: "x2", decision: "reject" },
    ]);
  });

  it("omits every optional field when an edit changes nothing", () => {
    expect(
      buildGate2Decisions([experiment], { x1: "edit" }, { x1: draftFromExperiment(experiment) }),
    ).toEqual([{ experiment_id: "x1", decision: "edit" }]);
  });

  it("sends only changed text fields", () => {
    const draft = { ...draftFromExperiment(experiment), metric: "Changed metric" };
    expect(buildGate2Decisions([experiment], { x1: "edit" }, { x1: draft })).toEqual([
      { experiment_id: "x1", decision: "edit", metric: "Changed metric" },
    ]);
  });

  it("sends the complete rule only when a rule value changed", () => {
    const draft = draftFromExperiment(experiment);
    draft.rule = { ...draft.rule, trials: 12, on_fail: "kill" };
    expect(buildGate2Decisions([experiment], { x1: "edit" }, { x1: draft })).toEqual([
      {
        experiment_id: "x1",
        decision: "edit",
        rule: { trials: 12, pass_at_least: 5, fail_below: 3, on_fail: "kill" },
      },
    ]);
  });
});
