import type { Experiment, ExperimentDecision, ExperimentRule } from "@/lib/contract";

export type Gate2Choice = ExperimentDecision["decision"];

export interface ExperimentDraft {
  hypothesis: string;
  metric: string;
  rule: ExperimentRule;
}

export function draftFromExperiment(experiment: Experiment): ExperimentDraft {
  return {
    hypothesis: experiment.hypothesis,
    metric: experiment.metric,
    rule: { ...experiment.rule },
  };
}

function rulesEqual(a: ExperimentRule, b: ExperimentRule): boolean {
  return (
    a.trials === b.trials &&
    a.pass_at_least === b.pass_at_least &&
    a.fail_below === b.fail_below &&
    a.on_fail === b.on_fail
  );
}

/** Build Gate 2 decisions without sending unchanged edit fields back to the API. */
export function buildGate2Decisions(
  experiments: Experiment[],
  choices: Record<string, Gate2Choice>,
  drafts: Record<string, ExperimentDraft>,
): ExperimentDecision[] {
  return experiments.map((experiment) => {
    const choice = choices[experiment.id];
    if (!choice) throw new Error(`Choose accept, edit or reject for experiment ${experiment.id}.`);

    const decision: ExperimentDecision = {
      experiment_id: experiment.id,
      decision: choice,
    };
    if (choice !== "edit") return decision;

    const draft = drafts[experiment.id] ?? draftFromExperiment(experiment);
    if (draft.hypothesis !== experiment.hypothesis) decision.hypothesis = draft.hypothesis;
    if (draft.metric !== experiment.metric) decision.metric = draft.metric;
    if (!rulesEqual(draft.rule, experiment.rule)) decision.rule = { ...draft.rule };
    return decision;
  });
}
