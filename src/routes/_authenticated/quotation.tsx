import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { jobsQuery, updateJobStatus } from "@/lib/data";
import { calculateQuote, eur, REFERENCE_QUOTE, DIRT_OPTIONS, type QuoteInputs } from "@/lib/domain";
import { usePricingSettings } from "@/lib/settings";
import { explainQuote } from "@/lib/ai.functions";
import { pageHead } from "@/lib/head";
import { PageHeader, Panel, Field, Notice } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Search = { jobId?: string | undefined };
export const Route = createFileRoute("/_authenticated/quotation")({
  validateSearch: (s: Record<string, unknown>): Search => ({ jobId: typeof s["jobId"] === "string" ? s["jobId"] : undefined }),
  head: pageHead("AI Quotation", "Calculate drone façade cleaning quotations with transparent assumptions."),
  component: QuotationPage,
});

function QuotationPage() {
  const { jobId: initialJob } = Route.useSearch();
  const qc = useQueryClient();
  const jobs = useQuery(jobsQuery);
  const [settings] = usePricingSettings();
  const explain = useServerFn(explainQuote);
  const [jobId, setJobId] = useState<string>(initialJob ?? "");
  const [i, setI] = useState<QuoteInputs>(REFERENCE_QUOTE);
  const [dirt, setDirt] = useState("Moderate");
  const [aiText, setAiText] = useState("");
  const [busy, setBusy] = useState<"ai" | "save" | null>(null);
  const r = useMemo(() => calculateQuote(i), [i]);
  const job = jobs.data?.find((j) => j.id === jobId);

  useEffect(() => {
    if (!job?.buildings) return;
    const area = Number(job.buildings.exterior_area);
    setDirt(job.buildings.dirt_condition);
    setI((p) => ({ ...p, area, dailyRate: settings.dailyRate, crewSize: settings.crewSize, partnerMarginPct: settings.partnerMarginPct, workingDays: Math.max(1, Math.round((area / settings.areaPerDay) * 2) / 2) }));
  }, [job?.id, settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const num = (k: keyof QuoteInputs) => ({
    type: "number" as const, min: 0, value: i[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setI((p) => ({ ...p, [k]: Math.max(0, Number(e.target.value) || 0) })),
  });

  async function runExplain() {
    setBusy("ai");
    try {
      const res = await explain({ data: { inputs: { ...i }, results: { ...r }, context: `Dirt: ${dirt}. Building: ${job?.buildings?.name ?? "reference building (one-building proposal assumption)"}; access: ${job?.buildings?.access_constraints ?? "difficult conventional access"}.` } });
      setAiText(res.text);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!job) { toast.error("Choose a job to attach this quotation to."); return; }
    setBusy("save");
    try {
      const { error } = await supabase.from("quotations").insert({
        job_id: job.id, area: i.area, crew_size: i.crewSize, working_days: i.workingDays, daily_rate: i.dailyRate,
        additional_costs: r.additional, partner_margin: r.partnerMargin, total_price: r.total,
        assumptions: { ...i, dirt, note: "Indicative reference assumptions — not validated national averages." }, ai_explanation: aiText || null,
      });
      if (error) throw error;
      await supabase.from("jobs").update({ quoted_price: r.total, estimated_duration: i.workingDays }).eq("id", job.id);
      if (["Submitted", "Under Review"].includes(job.status)) await updateJobStatus(job, "Quoted", `Quotation ${eur(r.total)}`);
      toast.success(`Quotation saved to ${job.job_number}`);
      qc.invalidateQueries();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="AI Quotation" subtitle="Estimated Job Cost = Daily Operating Rate × Working Days + Additional Costs." />
      <Notice>Default values come from one reference building in the business proposal (~1,500 m², €2,500/day, ~3 days, ~€7,500, ~€5/m²). They are illustrative assumptions, not validated national average prices.</Notice>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Inputs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Job (optional — pre-fills building data)">
                <Select value={jobId} onValueChange={setJobId}>
                  <SelectTrigger><SelectValue placeholder="Reference scenario" /></SelectTrigger>
                  <SelectContent>{(jobs.data ?? []).map((j) => <SelectItem key={j.id} value={j.id}>{j.job_number} · {j.buildings?.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Exterior cleaning area (m²)"><Input {...num("area")} /></Field>
            <Field label="Crew members"><Input {...num("crewSize")} /></Field>
            <Field label="Estimated working days"><Input {...num("workingDays")} step={0.5} /></Field>
            <Field label="Daily reference rate (€)" hint="Indicative — enter your own"><Input {...num("dailyRate")} /></Field>
            <Field label="Dirt condition">
              <Select value={dirt} onValueChange={setDirt}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DIRT_OPTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Equipment & setup (€)"><Input {...num("equipmentCosts")} /></Field>
            <Field label="Travel & logistics (€)"><Input {...num("travelCosts")} /></Field>
            <Field label="Other operating expenses (€)"><Input {...num("otherCosts")} /></Field>
            <Field label="Partner commercial margin (%)" hint="Where applicable"><Input {...num("partnerMarginPct")} /></Field>
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Quotation">
            <dl className="divide-y text-sm">
              <Row k="Operating cost (rate × days)" v={eur(r.operating)} />
              <Row k="Additional operating expenses" v={eur(r.additional)} />
              <Row k="Estimated Fassadex fee" v={eur(r.fassadexFee)} strong />
              <Row k="Partner commercial margin" v={eur(r.partnerMargin)} />
              <Row k="Estimated cost per m²" v={eur(r.perM2, 2)} />
              <Row k="Estimated job duration" v={`${r.durationDays} day${r.durationDays === 1 ? "" : "s"}`} />
            </dl>
            <div className="mt-4 flex items-end justify-between rounded-xl bg-navy p-4 text-navy-foreground">
              <span className="text-sm opacity-80">Total customer quotation</span>
              <span className="font-display text-3xl font-semibold">{eur(r.total)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={runExplain} variant="outline" disabled={!!busy} className="gap-1.5">
                {busy === "ai" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Explain with AI
              </Button>
              <Button onClick={save} disabled={!!busy} className="gap-1.5"><Save className="h-4 w-4" />Save to job</Button>
            </div>
          </Panel>
          {aiText && (
            <Panel title="AI explanation">
              <p className="whitespace-pre-line text-sm leading-relaxed">{aiText}</p>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between py-2.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={strong ? "font-semibold" : ""}>{v}</dd>
    </div>
  );
}
