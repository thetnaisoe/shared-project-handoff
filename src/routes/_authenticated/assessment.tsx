import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { jobsQuery, uploadPhotos, type Assessment } from "@/lib/data";
import { ACCESS_OPTIONS, DIRT_OPTIONS, FREQUENCY_OPTIONS, SURFACE_OPTIONS } from "@/lib/domain";
import { assessBuilding } from "@/lib/ai.functions";
import { pageHead } from "@/lib/head";
import { PageHeader, Panel, Field, StatusBadge, DemoTag } from "@/components/app/ui-bits";
import { AssessmentCard } from "@/components/app/AssessmentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/assessment")({
  head: pageHead("Building Assessment", "Submit buildings and run AI drone-cleaning suitability assessments."),
  component: AssessmentPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Building name is required").max(120),
  address: z.string().trim().min(1, "Address is required").max(200),
  city: z.string().trim().min(1, "City is required").max(80),
  height: z.coerce.number().positive("Height must be positive").max(1000),
  exterior_area: z.coerce.number().positive("Area must be positive").max(1_000_000),
  surface_type: z.string().min(1, "Choose a surface type"),
  dirt_condition: z.string().min(1, "Choose a dirt condition"),
  access_constraints: z.string().min(1, "Choose an accessibility option"),
  cleaning_frequency: z.string().min(1, "Choose a frequency"),
  requested_date: z.string().min(1, "Requested date is required"),
  floors: z.coerce.number().int().min(0).max(300).optional(),
  existing_method: z.string().max(200).optional(),
  site_notes: z.string().max(2000).optional(),
  customer_budget: z.coerce.number().min(0).optional(),
});

const empty = { name: "", address: "", city: "", height: "", exterior_area: "", surface_type: "", dirt_condition: "", access_constraints: "", cleaning_frequency: "", requested_date: "", floors: "", existing_method: "", site_notes: "", customer_budget: "" };

function AssessmentPage() {
  const qc = useQueryClient();
  const jobs = useQuery(jobsQuery);
  const assess = useServerFn(assessBuilding);
  const [f, setF] = useState(empty);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<Assessment | null>(null);
  const set = (k: keyof typeof empty) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ""));
    const parsed = schema.safeParse(clean);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setSaving(true);
    try {
      const { requested_date, ...b } = parsed.data;
      const photos = files.length ? await uploadPhotos(files, "buildings") : [];
      const { data: building, error } = await supabase.from("buildings").insert({ ...b, floors: b.floors ?? null, existing_method: b.existing_method ?? null, site_notes: b.site_notes ?? null, customer_budget: b.customer_budget ?? null, photos }).select().single();
      if (error) throw error;
      const { data: job, error: jErr } = await supabase.from("jobs").insert({ building_id: building.id, requested_date }).select().single();
      if (jErr) throw jErr;
      await supabase.from("job_events").insert({ job_id: job.id, to_status: "Submitted", note: "Building request submitted" });
      toast.success(`Request saved as ${job.job_number}`);
      setF(empty);
      setFiles([]);
      await qc.invalidateQueries();
      runAssessment(building.id, job.id);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function runAssessment(buildingId: string, jobId: string) {
    setRunning(jobId);
    setResult(null);
    try {
      const a = await assess({ data: { buildingId, jobId } });
      setResult(a as Assessment);
      toast.success("AI suitability assessment generated");
      qc.invalidateQueries();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRunning(null);
    }
  }

  return (
    <>
      <PageHeader title="Building Assessment" subtitle="Submit a building request, then screen it for drone-cleaning suitability." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Panel title="New building request" subtitle="Fields marked * are required.">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Building name *"><Input value={f.name} onChange={(e) => set("name")(e.target.value)} /></Field>
            <Field label="City *"><Input value={f.city} onChange={(e) => set("city")(e.target.value)} /></Field>
            <div className="sm:col-span-2"><Field label="Building address *"><Input value={f.address} onChange={(e) => set("address")(e.target.value)} /></Field></div>
            <Field label="Building height (m) *"><Input type="number" value={f.height} onChange={(e) => set("height")(e.target.value)} /></Field>
            <Field label="Glass / façade area (m²) *"><Input type="number" value={f.exterior_area} onChange={(e) => set("exterior_area")(e.target.value)} /></Field>
            <Pick label="Surface type *" value={f.surface_type} onChange={set("surface_type")} options={SURFACE_OPTIONS} />
            <Pick label="Dirt condition *" value={f.dirt_condition} onChange={set("dirt_condition")} options={DIRT_OPTIONS} />
            <Pick label="Accessibility *" value={f.access_constraints} onChange={set("access_constraints")} options={ACCESS_OPTIONS} />
            <Pick label="Cleaning frequency *" value={f.cleaning_frequency} onChange={set("cleaning_frequency")} options={FREQUENCY_OPTIONS} />
            <Field label="Requested cleaning date *"><Input type="date" value={f.requested_date} onChange={(e) => set("requested_date")(e.target.value)} /></Field>
            <Field label="Number of floors"><Input type="number" value={f.floors} onChange={(e) => set("floors")(e.target.value)} /></Field>
            <Field label="Existing cleaning method"><Input value={f.existing_method} onChange={(e) => set("existing_method")(e.target.value)} /></Field>
            <Field label="Estimated customer budget (€)"><Input type="number" value={f.customer_budget} onChange={(e) => set("customer_budget")(e.target.value)} /></Field>
            <div className="sm:col-span-2"><Field label="Building photographs"><Input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /></Field></div>
            <div className="sm:col-span-2"><Field label="Additional site notes"><Textarea rows={3} value={f.site_notes} onChange={(e) => set("site_notes")(e.target.value)} /></Field></div>
            <div className="sm:col-span-2"><Button disabled={saving} className="w-full sm:w-auto">{saving ? "Saving…" : "Submit & assess"}</Button></div>
          </form>
        </Panel>

        <div className="space-y-6">
          <Panel title="AI suitability result">
            {running ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Analysing building against the four service criteria…</p>
            ) : result ? (
              <AssessmentCard a={result} />
            ) : (
              <p className="text-sm text-muted-foreground">Submit a building or pick one below to run an assessment.</p>
            )}
          </Panel>
          <Panel title="Submitted buildings">
            <ul className="divide-y">
              {(jobs.data ?? []).map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to="/jobs/$jobId" params={{ jobId: j.id }} className="flex items-center gap-2 truncate font-medium hover:text-primary">{j.buildings?.name}{j.is_demo && <DemoTag />}</Link>
                    <p className="text-xs text-muted-foreground">{j.job_number} · {j.buildings?.city} · <StatusBadge status={j.status} /></p>
                  </div>
                  <Button size="sm" variant="outline" disabled={!!running} onClick={() => runAssessment(j.building_id, j.id)} className="shrink-0 gap-1">
                    {running === j.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}Assess
                  </Button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Pick({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </Field>
  );
}
