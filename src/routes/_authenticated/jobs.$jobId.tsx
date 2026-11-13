import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, Sparkles, Loader2, Calculator, CalendarDays, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { jobQuery, updateJobStatus, signedUrls } from "@/lib/data";
import { eur, JOB_STATUSES } from "@/lib/domain";
import { assessBuilding } from "@/lib/ai.functions";
import { PageHeader, Panel, StatusBadge, DemoTag, Loading, Notice } from "@/components/app/ui-bits";
import { AssessmentCard } from "@/components/app/AssessmentCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  head: () => ({ meta: [{ title: "Job details — FASSADEX" }, { name: "description", content: "Drone façade cleaning job details." }, { property: "og:title", content: "Job details — FASSADEX" }, { property: "og:description", content: "Drone façade cleaning job details." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: JobPage,
});

function JobPage() {
  const { jobId } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery(jobQuery(jobId));
  const assess = useServerFn(assessBuilding);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => { if (q.data) setNotes(q.data.job.operator_notes ?? ""); }, [q.data?.job.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { signedUrls(q.data?.job.buildings?.photos ?? []).then(setPhotos).catch(() => {}); }, [q.data?.job.buildings?.photos]);

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <Notice>Job not found.</Notice>;
  const { job, assessments, quotations, events } = q.data;
  const b = job.buildings!;

  async function setStatus(to: string, note?: string) {
    setBusy(to);
    try {
      await updateJobStatus(job, to, note);
      toast.success(`Status → ${to}`);
      qc.invalidateQueries();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  }
  async function saveNotes() {
    const { error } = await supabase.from("jobs").update({ operator_notes: notes.slice(0, 4000) }).eq("id", job.id);
    if (error) toast.error(error.message); else { toast.success("Notes saved"); qc.invalidateQueries(); }
  }
  async function runAssess() {
    setBusy("assess");
    try { await assess({ data: { buildingId: b.id, jobId: job.id } }); toast.success("Assessment generated"); qc.invalidateQueries(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  }

  return (
    <>
      <PageHeader
        title={`${job.job_number} · ${b.name}`}
        subtitle={`${b.address}, ${b.city}`}
        actions={<StatusBadge status={job.status} />}
      />
      {job.is_demo && <div className="mb-4"><Notice>Demonstration data — fictional building details and simulated job activity.</Notice></div>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Building information">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              {[["Height", `${b.height} m`], ["Glass area", `${Number(b.exterior_area).toLocaleString()} m²`], ["Floors", b.floors ?? "—"], ["Surface", b.surface_type], ["Dirt", b.dirt_condition], ["Access", b.access_constraints], ["Frequency", b.cleaning_frequency], ["Existing method", b.existing_method ?? "—"], ["Budget", eur(b.customer_budget)], ["Requested", job.requested_date ?? "—"], ["Scheduled", job.scheduled_date ?? "—"], ["Crew", job.assigned_crew ?? "—"]].map(([k, v]) => (
                <div key={k as string}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
            {b.site_notes && <p className="mt-4 rounded-lg bg-muted p-3 text-sm">{b.site_notes}</p>}
            {photos.length > 0 && <div className="mt-4 grid grid-cols-3 gap-2">{photos.map((u) => <img key={u} src={u} alt="Building" className="aspect-video w-full rounded-lg object-cover" />)}</div>}
          </Panel>
          <Panel title="AI suitability assessment" actions={<Button size="sm" variant="outline" onClick={runAssess} disabled={!!busy} className="gap-1">{busy === "assess" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{assessments.length ? "Re-assess" : "Assess"}</Button>}>
            {assessments[0] ? <AssessmentCard a={assessments[0]} /> : <p className="text-sm text-muted-foreground">No assessment yet.</p>}
          </Panel>
          <Panel title="Quotations" actions={<Button size="sm" variant="outline" asChild><Link to="/quotation" search={{ jobId: job.id }} className="gap-1"><Calculator className="h-3.5 w-3.5" />Generate</Link></Button>}>
            {quotations.length ? (
              <ul className="divide-y text-sm">{quotations.map((qq) => (
                <li key={qq.id} className="flex justify-between py-2"><span className="text-muted-foreground">{new Date(qq.created_at).toLocaleDateString()} · {qq.working_days} days × {eur(qq.daily_rate)}</span><span className="font-semibold">{eur(qq.total_price)}</span></li>
              ))}</ul>
            ) : <p className="text-sm text-muted-foreground">No quotation yet.</p>}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Actions">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setStatus("Approved", "Quote approved")} disabled={!!busy || job.status === "Approved"} className="gap-1"><Check className="h-4 w-4" />Approve</Button>
              <Button variant="destructive" onClick={() => setStatus("Rejected", "Job rejected")} disabled={!!busy || job.status === "Rejected"} className="gap-1"><X className="h-4 w-4" />Reject</Button>
              <Button variant="outline" asChild><Link to="/scheduling" className="gap-1"><CalendarDays className="h-4 w-4" />Schedule</Link></Button>
              <Button variant="outline" asChild><Link to="/reports" search={{ jobId: job.id }} className="gap-1"><FileText className="h-4 w-4" />Report</Link></Button>
            </div>
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-medium">Update status</p>
              <Select value={job.status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{JOB_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </Panel>
          <Panel title="Operational notes">
            <Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Site access, permissions, crew notes…" />
            <Button size="sm" className="mt-2" onClick={saveNotes}>Save notes</Button>
          </Panel>
          <Panel title="Status history">
            <ol className="space-y-3 border-l pl-4">
              {events.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal" />
                  <p className="font-medium">{e.from_status ? `${e.from_status} → ` : ""}{e.to_status}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}{e.note ? ` · ${e.note}` : ""}</p>
                </li>
              ))}
              {!events.length && <p className="text-sm text-muted-foreground">No history yet.</p>}
            </ol>
            {job.is_demo && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><DemoTag />Simulated activity</p>}
          </Panel>
        </div>
      </div>
    </>
  );
}
