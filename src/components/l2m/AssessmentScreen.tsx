import { useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClaimBadge } from "@/components/ClaimBadge";
import { ClaimDrawer } from "@/components/ClaimDrawer";
import { ExperimentsSection } from "@/components/l2m/ExperimentsSection";
import type { Assessment, Claim, RunState, TornadoBar } from "@/lib/contract";
import { claimById, formatAmount, formatClaimValue, splitClaimRefs } from "@/lib/ledger";
import { cn } from "@/lib/utils";

// Not yet in src/lib/contract.ts; read defensively until the backend contract adds it.
type Verdict = "continue" | "pivot" | "kill";
interface Decision {
  verdict: Verdict;
  provisional: boolean;
  viability_threshold: number;
  p_viable: number;
  reasons: string[];
}
const VERDICT_LABEL: Record<Verdict, string> = {
  continue: "Continue",
  pivot: "Pivot",
  kill: "Kill",
};
const VERDICT_CLASS: Record<Verdict, string> = {
  continue: "text-success",
  pivot: "text-warning",
  kill: "text-destructive",
};
const formatPercent = (p: number) => `${Math.round(p * 100)}%`;
const EUR = "EUR per year";

export function AssessmentScreen({
  state,
  onApproved,
}: {
  state: RunState;
  onApproved: (state: RunState) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const a = state.run.assessment;
  if (!a) return <p className="text-sm text-muted-foreground">No assessment available yet.</p>;
  const decision = (a as Assessment & { decision?: Decision | null }).decision ?? null;
  const output = a.market_model ? claimById(state, a.market_model.output_claim_id) : undefined;

  return (
    <div className="space-y-8">
      {decision ? <VerdictBanner d={decision} /> : <VerdictPending />}
      {a.limitations.length > 0 && <LimitationsBanner items={a.limitations} />}

      {a.evidence_floor_met ? (
        a.headline && (
          <p className="text-xl font-semibold leading-8">
            {splitClaimRefs(a.headline).map((p, j) =>
              p.kind === "text" ? (
                <span key={j}>{p.text}</span>
              ) : (
                <ClaimRef key={j} state={state} id={p.claimId} onOpen={setOpenId} />
              ),
            )}
          </p>
        )
      ) : (
        <section className="rounded-lg border border-warning bg-warning-soft p-5 text-warning-foreground">
          <h2 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Insufficient evidence
          </h2>
          <p className="mt-1 text-sm">More data is needed before we can give a firm answer:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {a.data_needed.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </section>
      )}

      {a.sections.map((s, i) => (
        <section key={i}>
          <h2 className="text-lg font-semibold">{s.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
            {splitClaimRefs(s.body).map((p, j) =>
              p.kind === "text" ? (
                <span key={j}>{p.text}</span>
              ) : (
                <ClaimRef key={j} state={state} id={p.claimId} onOpen={setOpenId} />
              ),
            )}
          </p>
        </section>
      ))}

      {output && a.market_model && (
        <RangeBar
          claim={output}
          label={a.market_model.output_label}
          onOpen={() => setOpenId(output.id)}
        />
      )}
      {a.market_model && a.market_model.tornado.length > 0 && (
        <TornadoChart bars={a.market_model.tornado} />
      )}

      {a.cannot_determine.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">What we could not determine</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {a.cannot_determine.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      <ExperimentsSection state={state} onApproved={onApproved} />

      {openId && (
        <ClaimDrawer
          state={state}
          claimId={openId}
          open
          onOpenChange={(o) => !o && setOpenId(null)}
        />
      )}
    </div>
  );
}

function VerdictBanner({ d }: { d: Decision }) {
  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn("text-4xl font-bold tracking-tight", VERDICT_CLASS[d.verdict])}>
          {VERDICT_LABEL[d.verdict]}
        </span>
        {d.provisional && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Provisional
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-medium">
        Chance of reaching {formatAmount(d.viability_threshold, EUR)} a year:{" "}
        {formatPercent(d.p_viable)}
      </p>
      {d.reasons.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {d.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Decided by code from rules fixed in advance, not by the AI.
      </p>
    </section>
  );
}

function VerdictPending() {
  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-4xl font-bold tracking-tight text-muted-foreground">
          No verdict yet
        </span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        This run does not include a decision, so continue / pivot / kill cannot be shown.
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        Decided by code from rules fixed in advance, not by the AI.
      </p>
    </section>
  );
}

function LimitationsBanner({ items }: { items: string[] }) {
  return (
    <section className="rounded-lg border bg-muted p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Info className="h-4 w-4" />
        Limitations
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </section>
  );
}

function ClaimRef({
  state,
  id,
  onOpen,
}: {
  state: RunState;
  id: string;
  onOpen: (id: string) => void;
}) {
  const claim = claimById(state, id);
  if (!claim) return <span className="text-muted-foreground">[missing claim]</span>;
  return (
    <button
      type="button"
      onClick={() => onOpen(id)}
      className="mx-0.5 inline-flex items-center gap-1.5 rounded px-1 align-middle hover:bg-muted"
    >
      <span className="font-semibold">{formatClaimValue(claim) ?? "claim"}</span>
      <ClaimBadge claim={claim} className="scale-90" />
    </button>
  );
}

function RangeBar({ claim, label, onOpen }: { claim: Claim; label: string; onOpen: () => void }) {
  const { p10, p50, p90 } = claim;
  if (p10 === null || p50 === null || p90 === null) return null;
  const max = p90 * 1.15 || 1;
  const pct = (n: number) => `${(n / max) * 100}%`;
  const fmt = (n: number) => formatAmount(n, claim.unit);
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{label}</h2>
        <button type="button" onClick={onOpen}>
          <ClaimBadge claim={claim} />
        </button>
      </div>
      <div className="relative mt-8 h-3 rounded-full bg-muted">
        <div
          className="absolute h-3 rounded-full bg-primary/30"
          style={{ left: pct(p10), width: `calc(${pct(p90)} - ${pct(p10)})` }}
        />
        {(
          [
            ["P10", p10],
            ["P50", p50],
            ["P90", p90],
          ] as const
        ).map(([k, v]) => (
          <div
            key={k}
            className="absolute -top-7 -translate-x-1/2 text-center"
            style={{ left: pct(v) }}
          >
            <span
              className={cn("text-xs", k === "P50" ? "font-semibold" : "text-muted-foreground")}
            >
              {fmt(v)}
            </span>
            <div
              className={cn(
                "mx-auto mt-1 w-0.5",
                k === "P50" ? "h-5 bg-primary" : "h-4 bg-muted-foreground",
              )}
            />
            <span className="text-[10px] text-muted-foreground">{k}</span>
          </div>
        ))}
      </div>
      <div className="h-8" />
    </section>
  );
}

const DRIVER_LABEL: Record<string, string> = {
  n_target_orgs: "Target organisations",
  share_need_budget: "Share with need & budget",
  adoption_rate: "Adoption rate",
  price_per_org: "Price per organisation",
  achievable_share: "Achievable share",
};

function TornadoChart({ bars }: { bars: TornadoBar[] }) {
  const data = [...bars]
    .sort((x, y) => y.swing - x.swing)
    .map((b) => ({
      name: DRIVER_LABEL[b.driver] ?? b.driver,
      range: [Math.min(b.low_output, b.high_output), Math.max(b.low_output, b.high_output)],
    }));
  const fmt = (n: number) => formatAmount(n, EUR);
  return (
    <section>
      <h2 className="text-lg font-semibold">What moves the result most</h2>
      <div className="mt-3 h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis type="number" tickFormatter={fmt} domain={["auto", "auto"]} fontSize={12} />
            <YAxis type="category" dataKey="name" width={170} fontSize={12} />
            <Tooltip
              formatter={(v) =>
                Array.isArray(v) ? `${fmt(Number(v[0]))} – ${fmt(Number(v[1]))}` : String(v)
              }
            />
            <Bar dataKey="range" fill="var(--primary)" radius={3} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
