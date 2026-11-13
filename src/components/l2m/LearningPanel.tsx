import { ArrowRight } from "lucide-react";
import type { RuleOutcome, RunState, Verdict } from "@/lib/contract";
import {
  formatBelief,
  formatOutputRange,
  formatPercent,
  latestUpdate,
  METHOD_LABEL,
  VERDICT_LABEL,
} from "@/lib/ledger";
import { cn } from "@/lib/utils";

const VERDICT_SCORE: Record<Verdict, number> = { kill: 0, pivot: 1, continue: 2 };

const OUTCOME_CLASS: Record<RuleOutcome, string> = {
  pass: "bg-success text-success-foreground",
  fail: "bg-destructive text-destructive-foreground",
  inconclusive: "bg-warning/20 text-foreground",
  pending: "bg-muted text-muted-foreground",
};

function dirClass(before: number, after: number) {
  if (after > before) return "text-success";
  if (after < before) return "text-destructive";
  return "text-foreground";
}

function Row({ label, before, after, cls }: { label: string; before: string; after: string; cls: string }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[12rem_1fr] sm:items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{before}</span>
        <ArrowRight className={cn("h-4 w-4", cls)} aria-label="to" />
        <strong className={cls}>{after}</strong>
      </span>
    </div>
  );
}

export function LearningPanel({ state, onOpenClaim }: { state: RunState; onOpenClaim: (id: string) => void }) {
  const u = latestUpdate(state);
  if (!u) return null;
  const nextId = u.rank_after[0];
  const next = state.experiments.find((x) => x.id === nextId);
  return (
    <>
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold">What just changed</h2>
        <div className="mt-2 divide-y">
          <Row label="Tested share" before={formatBelief(u.prior)} after={formatBelief(u.posterior)}
            cls={dirClass(u.prior.p50, u.posterior.p50)} />
          <Row label="Revenue" before={formatOutputRange(u.output_before)} after={formatOutputRange(u.output_after)}
            cls={dirClass(u.output_before.p50, u.output_after.p50)} />
          <Row label="Chance of reaching the threshold" before={formatPercent(u.p_viable_before)}
            after={formatPercent(u.p_viable_after)} cls={dirClass(u.p_viable_before, u.p_viable_after)} />
          <Row label="Verdict" before={VERDICT_LABEL[u.verdict_before]} after={VERDICT_LABEL[u.verdict_after]}
            cls={dirClass(VERDICT_SCORE[u.verdict_before], VERDICT_SCORE[u.verdict_after])} />
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">Next experiment:</span>
          {nextId ? (
            <span>
              {nextId}
              {next && ` · ${METHOD_LABEL[next.method]}`}
            </span>
          ) : (
            <span className="text-muted-foreground">none</span>
          )}
          {u.mocked && (
            <span className="rounded bg-destructive px-1.5 py-0.5 text-xs font-semibold text-destructive-foreground">
              MOCKED
            </span>
          )}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Learning timeline</h2>
        <ol className="mt-3 border-l pl-5">
          {state.updates.map((x) => (
            <li key={x.id} className="relative mb-3">
              <span className="absolute -left-[1.6rem] top-4 h-2.5 w-2.5 rounded-full bg-primary" />
              <button type="button" onClick={() => onOpenClaim(x.claim_id)}
                className="w-full rounded-md border bg-card p-3 text-left text-sm hover:bg-accent">
                <span className="block">
                  Prior {formatBelief(x.prior)} → evidence {x.successes} of {x.trials} → posterior{" "}
                  {formatBelief(x.posterior)}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className={cn("rounded-full px-2 py-0.5 font-medium capitalize", OUTCOME_CLASS[x.outcome])}>
                    {x.outcome}
                  </span>
                  <span className="text-muted-foreground">
                    {VERDICT_LABEL[x.verdict_before]} → {VERDICT_LABEL[x.verdict_after]}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
