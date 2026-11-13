import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Circle, Loader2, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { DraftAssumption, Interpretation, RefusalKind, RunState, StepStatus } from "@/lib/contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { startRun } from "@/components/l2m/startRun";
import { cn } from "@/lib/utils";

const STEP_ICON: Record<StepStatus, React.ReactNode> = {
  running: <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="Running" />,
  done: <Check className="h-4 w-4 text-success" aria-label="Done" />,
  failed: <X className="h-4 w-4 text-destructive" aria-label="Failed" />,
  skipped: <Circle className="h-4 w-4 text-muted-foreground" aria-label="Skipped" />,
};

function ElapsedTimer() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setSecs(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return <span className="font-mono text-sm tabular-nums text-muted-foreground" aria-label="Elapsed time">{mm}:{ss}</span>;
}

export function ProgressScreen({ state }: { state: RunState }) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Working on it…</h2>
        <ElapsedTimer />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Analysing your idea. This takes 1–2 minutes: we read your idea, search the web, check every
        quote against its page, and run 5,000 simulations.
      </p>
      {state.steps.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Queued. Starting shortly.</p>}
      <ol className="mt-3 space-y-3">
        {state.steps.map((s) => (
          <li key={s.id} className={cn("flex gap-3", s.status === "skipped" && "text-muted-foreground")}>
            <span className="mt-0.5">{STEP_ICON[s.status]}</span>
            <div>
              <p className="text-sm font-medium capitalize">{s.name}</p>
              {s.message && <p className="text-sm text-muted-foreground">{s.message}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const Chips = ({ items }: { items: string[] }) => (
  <div className="mt-1 flex flex-wrap gap-1.5">
    {items.map((x, i) => (
      <span key={i} className="rounded-full border bg-muted px-2.5 py-0.5 text-xs">{x}</span>
    ))}
  </div>
);

const isShare = (a: DraftAssumption) => !!a.unit?.toLowerCase().startsWith("share");

function QuantileInput({ a, k, onChange }: { a: DraftAssumption; k: "p10" | "p50" | "p90"; onChange: (v: number | null) => void }) {
  const share = isShare(a);
  const v = a[k];
  const shown = v === null ? "" : share ? String(Math.round(v * 1000) / 10) : String(v);
  return (
    <label className="text-xs text-muted-foreground">
      {k.toUpperCase()}{share ? " (%)" : ""}
      <Input type="number" step="any" value={shown} className="mt-1 h-8"
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(null);
          const n = Number(raw);
          if (Number.isFinite(n)) onChange(share ? n / 100 : n);
        }} />
    </label>
  );
}

export function Gate1Screen({ runId, state, onApproved }: { runId: string; state: RunState; onApproved: (s: RunState) => void }) {
  const [interp, setInterp] = useState<Interpretation | null>(state.run.interpretation);
  const [busy, setBusy] = useState(false);
  if (!interp) return <p className="text-sm text-muted-foreground">No interpretation available yet.</p>;

  const setA = (id: string, patch: Partial<DraftAssumption>) =>
    setInterp({ ...interp, assumptions: interp.assumptions.map((a) => (a.id === id ? { ...a, ...patch } : a)) });

  async function approve() {
    setBusy(true);
    try {
      onApproved(await api.approve(runId, { gate: 1, approved: true, interpretation: interp }));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : "Could not approve");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Check our reading of your idea before we research it</h2>
      <section className="space-y-3 rounded-lg border bg-card p-5 text-sm">
        <p>{interp.summary}</p>
        <p><span className="text-muted-foreground">Technology:</span> {interp.technology}</p>
        <p><span className="text-muted-foreground">TRL:</span> {interp.trl_guess ?? "Unknown"}</p>
        <div><span className="text-muted-foreground">Target customers</span><Chips items={interp.target_customers} /></div>
        <div><span className="text-muted-foreground">Market drivers</span><Chips items={interp.market_drivers} /></div>
      </section>
      <section>
        <h3 className="text-lg font-semibold">Assumptions</h3>
        <ul className="mt-3 space-y-3">
          {interp.assumptions.map((a) => (
            <li key={a.id} className="rounded-lg border bg-card p-4">
              <p className="text-sm">{a.text}</p>
              {a.unit && <p className="text-xs text-muted-foreground">Unit: {a.unit}</p>}
              <div className="mt-2 grid grid-cols-3 gap-3">
                {(["p10", "p50", "p90"] as const).map((k) => (
                  <QuantileInput key={k} a={a} k={k} onChange={(v) => setA(a.id, { [k]: v })} />
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <Button size="lg" onClick={approve} disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}Approve and research
      </Button>
    </div>
  );
}

export function NeedsInputScreen({ state }: { state: RunState }) {
  const navigate = useNavigate();
  const scope = state.run.scope;
  const questions = scope?.clarifying_questions ?? [];
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));
  const [busy, setBusy] = useState(false);

  async function restart() {
    const qa = questions
      .map((q, i) => (answers[i]?.trim() ? `Q: ${q}\nA: ${answers[i].trim()}` : null))
      .filter(Boolean)
      .join("\n\n");
    setBusy(true);
    const id = await startRun({
      idea_text: qa ? `${state.run.idea_text}\n\nAdditional details:\n${qa}` : state.run.idea_text,
      context: state.run.context,
    });
    setBusy(false);
    if (id) navigate({ to: "/runs/$id", params: { id } });
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">We need a bit more detail</h2>
      {scope?.reasons.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {scope.reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      ) : null}
      {questions.map((q, i) => (
        <label key={i} className="block text-sm font-medium">
          {q}
          <Textarea className="mt-1.5 font-normal" rows={3} value={answers[i] ?? ""}
            onChange={(e) => setAnswers(answers.map((x, j) => (j === i ? e.target.value : x)))} />
        </label>
      ))}
      <Button size="lg" onClick={restart} disabled={busy || !answers.some((a) => a.trim())}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}Start again with answers
      </Button>
    </div>
  );
}

const REFUSAL_TITLE: Record<RefusalKind, string> = {
  harmful_or_dual_use: "We won't assess this idea",
  physically_infeasible: "This doesn't look physically feasible",
  outside_scope: "Outside what we assess",
};

export function RefusedScreen({ state }: { state: RunState }) {
  const scope = state.run.scope;
  const kind = scope?.refusal_kind;
  return (
    <section className="rounded-lg border bg-card p-6">
      <ShieldAlert className="h-8 w-8 text-destructive" />
      <h2 className="mt-3 text-xl font-semibold">{kind ? REFUSAL_TITLE[kind] : "We can't assess this idea"}</h2>
      {scope?.reasons.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {scope.reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      ) : null}
      <Link to="/" className="mt-4 inline-block text-sm text-primary underline">Back to New idea</Link>
    </section>
  );
}
