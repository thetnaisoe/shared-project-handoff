import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plane, Handshake, Building2, Info, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { experimentsQuery } from "@/lib/data";
import { calculateMarket, compactEur, DEFAULT_MARKET, READINESS_DIMENSIONS, readinessScore, type EvidenceLevel, type MarketInputs, type ReadinessKey } from "@/lib/domain";
import { pageHead } from "@/lib/head";
import { PageHeader, Panel, Field } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/intelligence")({
  head: pageHead("Commercial Intelligence", "Business model, market sizing, risks, experiments and readiness for FASSADEX."),
  component: IntelPage,
});

type Kind = "Fact" | "Estimate" | "Assumption";
type Level = "Low" | "Medium" | "High";
const RISKS: { q: string; kind: Kind; evidence: Level; severity: Level; note: string }[] = [
  { q: "Will cleaning partners adopt the service?", kind: "Assumption", evidence: "Low", severity: "High", note: "No partner interviews completed yet. Tested by partner interviews." },
  { q: "Can drone cleaning achieve sufficient cleaning quality?", kind: "Assumption", evidence: "Low", severity: "High", note: "Requires a representative façade test clean." },
  { q: "Can the service operate safely and legally?", kind: "Estimate", evidence: "Medium", severity: "High", note: "Drone regulation exists; site-level permission timing unknown." },
  { q: "Are jobs commercially profitable?", kind: "Estimate", evidence: "Low", severity: "High", note: "Based on one reference building (€2,500/day). Costs not yet quoted." },
  { q: "Is the pricing competitive?", kind: "Estimate", evidence: "Low", severity: "Medium", note: "~€5/m² reference; no benchmark against rope access yet." },
  { q: "Will building customers accept the cleaning result?", kind: "Assumption", evidence: "Low", severity: "Medium", note: "Depends on test-clean outcome and customer expectations." },
  { q: "Can recurring demand be generated?", kind: "Assumption", evidence: "Low", severity: "Medium", note: "Twice-annual cleaning assumed for demo building." },
  { q: "Can enough suitable buildings be identified?", kind: "Estimate", evidence: "Medium", severity: "Medium", note: "2.5% suitability share is an assumption applied to a market proxy." },
];
const V: Record<Level, number> = { Low: 1, Medium: 2, High: 3 };
const KIND_STYLE: Record<Kind, string> = {
  Fact: "bg-success-soft text-success",
  Estimate: "bg-primary-soft text-primary",
  Assumption: "border border-dashed border-warning text-warning-foreground",
};

const RKEY = "fassadex.readiness";
const DEFAULT_LEVELS: Record<ReadinessKey, EvidenceLevel> = { customer: "Assumed", technical: "Assumed", operational: "Partial", financial: "Assumed", competitive: "Partial" };

function IntelPage() {
  const qc = useQueryClient();
  const exps = useQuery(experimentsQuery);
  const [m, setM] = useState<MarketInputs>(DEFAULT_MARKET);
  const mk = useMemo(() => calculateMarket(m), [m]);
  const [levels, setLevels] = useState(DEFAULT_LEVELS);
  useEffect(() => { try { const r = localStorage.getItem(RKEY); if (r) setLevels({ ...DEFAULT_LEVELS, ...JSON.parse(r) }); } catch { /* ignore */ } }, []);
  const setLevel = (k: ReadinessKey, v: EvidenceLevel) => { const n = { ...levels, [k]: v }; setLevels(n); localStorage.setItem(RKEY, JSON.stringify(n)); };
  const score = readinessScore(levels);
  const prioritized = [...RISKS].sort((a, b) => V[b.severity] * (4 - V[b.evidence]) - V[a.severity] * (4 - V[a.evidence]));

  // sensitivity: SOM change when each driver moves ±50%
  const sens = [
    { label: "Capture share (SOM %)", delta: calculateMarket({ ...m, capturePct: m.capturePct * 1.5 }).som - calculateMarket({ ...m, capturePct: m.capturePct * 0.5 }).som, weak: true },
    { label: "Drone-suitable share", delta: calculateMarket({ ...m, suitabilityPct: m.suitabilityPct * 1.5 }).som - calculateMarket({ ...m, suitabilityPct: m.suitabilityPct * 0.5 }).som, weak: true },
    { label: "Market proxy (TAM)", delta: calculateMarket({ ...m, tam: m.tam * 1.2 }).som - calculateMarket({ ...m, tam: m.tam * 0.8 }).som, weak: false },
  ];
  const maxDelta = Math.max(...sens.map((s) => s.delta));

  const [open, setOpen] = useState(false);
  const [nx, setNx] = useState({ title: "", assumption: "", objective: "", methodology: "", duration: "", resources: "", success_criteria: "", failure_criteria: "" });
  async function addExp() {
    if (!nx.title.trim() || !nx.assumption.trim() || !nx.methodology.trim() || !nx.success_criteria.trim()) { toast.error("Title, assumption, methodology and success criteria are required"); return; }
    const { error } = await supabase.from("experiments").insert(Object.fromEntries(Object.entries(nx).map(([k, v]) => [k, v.slice(0, 2000)])) as typeof nx);
    if (error) { toast.error(error.message); return; }
    toast.success("Experiment added"); setOpen(false); qc.invalidateQueries({ queryKey: ["experiments"] });
  }
  async function setExpStatus(id: string, status: string) {
    const { error } = await supabase.from("experiments").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["experiments"] });
  }

  return (
    <>
      <PageHeader title="Commercial Intelligence" subtitle="Validate the FASSADEX partner business model with transparent evidence." />
      <div className="flex items-center gap-2 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning-foreground"><Info className="h-4 w-4 shrink-0" />Illustrative figures from the FASSADEX business proposal. Not independently verified market statistics.</div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { icon: Plane, t: "FASSADEX", items: ["Qualifies building sites", "Plans approvals and safety", "Supplies drone crews and equipment", "Executes and documents the cleaning"] },
          { icon: Handshake, t: "Cleaning Partner", items: ["Maintains the customer relationship", "Packages and sells the offer", "Quotes and invoices the customer", "Coordinates site access"] },
          { icon: Building2, t: "Building Customer", items: ["Requests cleaning", "Approves the price and scope", "Provides site access", "Accepts the completed work"] },
        ].map((c, idx) => (
          <div key={c.t} className={cn("card-surface p-5", idx === 0 && "bg-navy text-navy-foreground")}>
            <c.icon className={cn("h-6 w-6", idx === 0 ? "text-teal" : "text-primary")} />
            <h3 className="mt-3 font-semibold">{c.t}</h3>
            <ul className="mt-2 space-y-1 text-sm opacity-90">{c.items.map((i) => <li key={i}>· {i}</li>)}</ul>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Market opportunity" subtitle="Change the assumptions to recalculate the scenario.">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { k: "TAM", v: mk.tam, d: "Broad German window & glass cleaning market proxy. A proxy, not drone-specific demand." },
              { k: "SAM", v: mk.sam, d: `Drone-suitable work at a ${m.suitabilityPct}% suitability assumption — unvalidated.` },
              { k: "SOM", v: mk.som, d: "Illustrative first-year scenario. Depends on partner adoption and crew capacity." },
            ].map((x) => (
              <div key={x.k} className="rounded-xl border p-4">
                <p className="text-xs font-bold tracking-wider text-muted-foreground">{x.k}</p>
                <p className="mt-1 font-display text-2xl font-semibold">{compactEur(x.v)}</p>
                <p className="mt-2 text-xs text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Field label="TAM proxy (€ billion)"><Input type="number" step={0.1} min={0} value={m.tam / 1e9} onChange={(e) => setM({ ...m, tam: Math.max(0, Number(e.target.value)) * 1e9 })} /></Field>
            <Field label="Drone-suitable share (%)"><Input type="number" step={0.1} min={0} max={100} value={m.suitabilityPct} onChange={(e) => setM({ ...m, suitabilityPct: Math.min(100, Math.max(0, Number(e.target.value))) })} /></Field>
            <Field label="Year-1 capture of SAM (%)"><Input type="number" step={0.05} min={0} max={100} value={Number(m.capturePct.toFixed(3))} onChange={(e) => setM({ ...m, capturePct: Math.min(100, Math.max(0, Number(e.target.value))) })} /></Field>
          </div>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setM(DEFAULT_MARKET)}>Reset to proposal figures</Button>

          <div className="mt-6">
            <h3 className="text-sm font-semibold">What moves the SOM most</h3>
            <p className="text-xs text-muted-foreground">Change in SOM when a driver moves from low to high (±50%, TAM ±20%).</p>
            <div className="mt-3 space-y-2">
              {sens.map((s) => (
                <div key={s.label} className="grid grid-cols-[10rem_minmax(0,1fr)_4rem] items-center gap-3 text-sm">
                  <span className="truncate">{s.label}</span>
                  <div className="h-3 rounded-full bg-muted"><div className={cn("h-3 rounded-full", s.weak ? "bg-warning" : "bg-success")} style={{ width: `${maxDelta ? (s.delta / maxDelta) * 100 : 0}%` }} /></div>
                  <span className="text-right text-muted-foreground">±{compactEur(s.delta / 2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-warning" />Weak evidence</span><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-success" />Stronger evidence</span></div>
          </div>
        </Panel>

        <Panel title="Commercial readiness score" subtitle="Evidence maturity — not the probability of business success.">
          <div className="flex items-end gap-2"><span className="font-display text-5xl font-semibold text-primary">{score.total}</span><span className="mb-1 text-muted-foreground">/ 100</span></div>
          <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-teal" style={{ width: `${score.total}%` }} /></div>
          <ul className="mt-5 space-y-3">
            {score.parts.map((p) => (
              <li key={p.key} className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.points} of {p.weight} pts · {p.level === "Missing" ? "no evidence earns no points" : p.level === "Validated" ? "full points for validated evidence" : "partial credit only"}</p>
                </div>
                <Select value={p.level} onValueChange={(v) => setLevel(p.key, v as EvidenceLevel)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Validated", "Partial", "Assumed", "Missing"] as const).map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">Weights: {READINESS_DIMENSIONS.map((d) => `${d.label.split(" ")[0]} ${d.weight}%`).join(" · ")}. Validated = 100%, Partial = 50%, Assumed = 20%, Missing = 0%.</p>
        </Panel>
      </div>

      <Panel className="mt-6" title="Claim ledger · prioritised risks" subtitle="Evidence quality and risk severity are rated separately. Ordered by severity × weakness of evidence.">
        <ul className="divide-y">
          {prioritized.map((r, i) => (
            <li key={r.q} className="grid gap-2 py-3 sm:grid-cols-[2rem_7rem_minmax(0,1fr)_auto] sm:items-center">
              <span className="text-sm font-semibold text-muted-foreground">#{i + 1}</span>
              <span className={cn("w-fit rounded-md px-2 py-0.5 text-xs font-semibold", KIND_STYLE[r.kind])}>{r.kind}</span>
              <div className="min-w-0"><p className="text-sm font-medium">{r.q}</p><p className="text-xs text-muted-foreground">{r.note}</p></div>
              <div className="flex gap-2 text-xs">
                <span className="rounded bg-muted px-2 py-0.5">Evidence: {r.evidence}</span>
                <span className={cn("rounded px-2 py-0.5", r.severity === "High" ? "bg-danger-soft text-destructive" : "bg-warning-soft text-warning-foreground")}>Severity: {r.severity}</span>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Experiment planner</h2>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1"><Plus className="h-4 w-4" />Add experiment</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(exps.data ?? []).map((e, i) => (
          <div key={e.id} className="card-surface flex flex-col p-5 text-sm">
            <h3 className="font-semibold">{i + 1}. {e.title}</h3>
            <p className="mt-0.5 text-muted-foreground">Tests: {e.assumption}</p>
            {e.objective && <p className="mt-3"><b>Objective:</b> {e.objective}</p>}
            <p className="mt-2"><b>Method:</b> {e.methodology}</p>
            <p className="mt-2"><b className="text-success">Pass:</b> {e.success_criteria}</p>
            {e.failure_criteria && <p><b className="text-destructive">Kill:</b> {e.failure_criteria}</p>}
            <p className="mt-2 text-muted-foreground">{[e.duration, e.resources].filter(Boolean).join(" · ")}</p>
            <div className="mt-auto pt-4">
              <Select value={e.status} onValueChange={(v) => setExpStatus(e.id, v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["Planned", "In Progress", "Passed", "Failed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">Decision support only — not investment, legal or regulatory advice.</p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New experiment</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {([["title", "Title *"], ["assumption", "Assumption tested *"], ["objective", "Objective"], ["duration", "Duration"], ["resources", "Estimated resources"]] as const).map(([k, l]) => (
              <Field key={k} label={l}><Input value={nx[k]} onChange={(e) => setNx({ ...nx, [k]: e.target.value })} /></Field>
            ))}
            {([["methodology", "Methodology *"], ["success_criteria", "Success criteria *"], ["failure_criteria", "Failure criteria"]] as const).map(([k, l]) => (
              <Field key={k} label={l}><Textarea rows={2} value={nx[k]} onChange={(e) => setNx({ ...nx, [k]: e.target.value })} /></Field>
            ))}
          </div>
          <DialogFooter><Button onClick={addExp}>Save experiment</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
