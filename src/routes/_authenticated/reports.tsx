import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { jobsQuery, jobQuery, uploadPhotos, signedUrls, updateJobStatus } from "@/lib/data";
import { eur } from "@/lib/domain";
import { pageHead } from "@/components/l2m/pageHead";
import { PageHeader, Panel, Field, Notice } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Search = { jobId?: string | undefined };
export const Route = createFileRoute("/_authenticated/reports")({
  validateSearch: (s: Record<string, unknown>): Search => ({ jobId: typeof s["jobId"] === "string" ? s["jobId"] : undefined }),
  head: pageHead("Job Reports", "Create and print drone façade cleaning completion reports."),
  component: ReportsPage,
});

function ReportsPage() {
  const search = Route.useSearch();
  const qc = useQueryClient();
  const jobs = useQuery(jobsQuery);
  const [jobId, setJobId] = useState(search.jobId ?? "");
  useEffect(() => {
    if (!jobId && jobs.data?.length) setJobId(jobs.data.find((j) => j.status === "Completed")?.id ?? jobs.data[0]!.id);
  }, [jobs.data, jobId]);
  const detail = useQuery({ ...jobQuery(jobId), enabled: !!jobId });
  const [form, setForm] = useState({ completed_area: "", actual_duration: "", completion_date: "", issues: "", operator_notes: "", customer_acceptance: "Pending" });
  const [before, setBefore] = useState<File[]>([]);
  const [after, setAfter] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [urls, setUrls] = useState<{ before: string[]; after: string[] }>({ before: [], after: [] });
  const report = detail.data?.reports[0];

  useEffect(() => {
    if (!report) { setUrls({ before: [], after: [] }); return; }
    Promise.all([signedUrls(report.before_photos), signedUrls(report.after_photos)]).then(([b, a]) => setUrls({ before: b, after: a })).catch(() => {});
  }, [report?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!detail.data) return;
    if (!form.completion_date) { toast.error("Completion date is required"); return; }
    setSaving(true);
    try {
      const [bp, ap] = await Promise.all([uploadPhotos(before, `reports/${jobId}/before`), uploadPhotos(after, `reports/${jobId}/after`)]);
      const { error } = await supabase.from("reports").insert({
        job_id: jobId, before_photos: bp, after_photos: ap,
        completed_area: form.completed_area ? Number(form.completed_area) : null, actual_duration: form.actual_duration ? Number(form.actual_duration) : null,
        completion_date: form.completion_date, issues: form.issues.slice(0, 2000) || null, operator_notes: form.operator_notes.slice(0, 2000) || null, customer_acceptance: form.customer_acceptance,
      });
      if (error) throw error;
      if (detail.data.job.status !== "Completed") await updateJobStatus(detail.data.job, "Completed", "Completion report generated");
      toast.success("Report generated");
      setBefore([]); setAfter([]);
      qc.invalidateQueries();
    } catch (err) { toast.error((err as Error).message); } finally { setSaving(false); }
  }

  const d = detail.data;
  const b = d?.job.buildings;
  const quote = d?.quotations[0];

  return (
    <>
      <PageHeader title="Job Reports" subtitle="Document completed work with before-and-after photographs." actions={report && <Button onClick={() => window.print()} className="gap-1.5"><Printer className="h-4 w-4" />Print / Save as PDF</Button>} />
      <div className="mb-6 max-w-md no-print">
        <Select value={jobId} onValueChange={setJobId}>
          <SelectTrigger><SelectValue placeholder="Choose a job" /></SelectTrigger>
          <SelectContent>{(jobs.data ?? []).map((j) => <SelectItem key={j.id} value={j.id}>{j.job_number} · {j.buildings?.name} ({j.status})</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {d && b && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <Panel title="Completion details" className="no-print">
            <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
              <Field label="Completed area (m²)"><Input type="number" min={0} value={form.completed_area} onChange={(e) => setForm({ ...form, completed_area: e.target.value })} /></Field>
              <Field label="Actual working days"><Input type="number" min={0} step={0.5} value={form.actual_duration} onChange={(e) => setForm({ ...form, actual_duration: e.target.value })} /></Field>
              <Field label="Completion date *"><Input type="date" value={form.completion_date} onChange={(e) => setForm({ ...form, completion_date: e.target.value })} /></Field>
              <Field label="Customer acceptance">
                <Select value={form.customer_acceptance} onValueChange={(v) => setForm({ ...form, customer_acceptance: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Pending", "Accepted", "Accepted with remarks", "Not accepted"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Before-cleaning photos"><Input type="file" accept="image/*" multiple onChange={(e) => setBefore(Array.from(e.target.files ?? []))} /></Field>
              <Field label="After-cleaning photos"><Input type="file" accept="image/*" multiple onChange={(e) => setAfter(Array.from(e.target.files ?? []))} /></Field>
              <div className="sm:col-span-2"><Field label="Issues encountered"><Textarea rows={2} value={form.issues} onChange={(e) => setForm({ ...form, issues: e.target.value })} /></Field></div>
              <div className="sm:col-span-2"><Field label="Operator notes"><Textarea rows={3} value={form.operator_notes} onChange={(e) => setForm({ ...form, operator_notes: e.target.value })} /></Field></div>
              <div className="sm:col-span-2"><Button disabled={saving}>{saving ? "Generating…" : "Generate report"}</Button></div>
            </form>
          </Panel>

          <section className="card-surface print-area p-6 sm:p-8">
            {!report ? <p className="text-sm text-muted-foreground">No completion report for this job yet.</p> : (
              <div className="space-y-6 text-sm">
                <div className="flex items-start justify-between border-b pb-4">
                  <div><p className="font-display text-lg font-bold tracking-wide text-primary">FASSADEX</p><h2 className="text-xl font-semibold">Job Completion Report</h2></div>
                  <div className="text-right text-xs text-muted-foreground"><p>{d.job.job_number}</p><p>Issued {new Date(report.created_at).toLocaleDateString()}</p>{d.job.is_demo && <p className="font-bold text-warning-foreground">DEMONSTRATION DATA</p>}</div>
                </div>
                <Sec n={1} t="Job details"><p>{d.job.job_number} · Crew: {d.job.assigned_crew ?? "—"} · Scheduled {d.job.scheduled_date ?? "—"}</p></Sec>
                <Sec n={2} t="Building information"><p>{b.name}, {b.address}, {b.city} · {b.height} m · {b.surface_type} · {b.access_constraints}</p></Sec>
                <Sec n={3} t="Approved cleaning scope"><p>{Number(b.exterior_area).toLocaleString()} m² façade · {quote ? `${quote.working_days} days · ${eur(quote.total_price)}` : "no quotation on file"}</p></Sec>
                <Sec n={4} t="Completed work"><p>{report.completed_area ?? "—"} m² cleaned in {report.actual_duration ?? "—"} working days</p></Sec>
                <Sec n={5} t="Before-and-after photographs">
                  {urls.before.length + urls.after.length === 0 ? <p className="text-muted-foreground">No photographs uploaded.</p> : (
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="mb-1 text-xs font-semibold">Before</p>{urls.before.map((u) => <img key={u} src={u} alt="Before cleaning" className="mb-2 w-full rounded-md" />)}</div>
                      <div><p className="mb-1 text-xs font-semibold">After</p>{urls.after.map((u) => <img key={u} src={u} alt="After cleaning" className="mb-2 w-full rounded-md" />)}</div>
                    </div>
                  )}
                </Sec>
                <Sec n={6} t="Cleaning observations"><p>{report.operator_notes ?? "—"}</p></Sec>
                <Sec n={7} t="Outstanding issues"><p>{report.issues ?? "None recorded"}</p></Sec>
                <Sec n={8} t="Completion date"><p>{report.completion_date ?? "—"}</p></Sec>
                <Sec n={9} t="Customer acceptance"><p className="font-semibold">{report.customer_acceptance}</p></Sec>
                <Notice>Photographs document the work performed. They do not by themselves prove regulatory compliance or objectively certify cleaning quality.</Notice>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function Sec({ n, t, children }: { n: number; t: string; children: React.ReactNode }) {
  return <div><h3 className="mb-1 text-sm font-semibold">{n}. {t}</h3>{children}</div>;
}
