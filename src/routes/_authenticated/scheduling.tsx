import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { jobsQuery, updateJobStatus, type JobWithBuilding } from "@/lib/data";
import { pageHead } from "@/components/l2m/pageHead";
import { PageHeader, Panel, StatusBadge, Field, Loading } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/scheduling")({
  head: pageHead("Scheduling", "Assign cleaning dates, crews and equipment to approved drone cleaning jobs."),
  component: SchedulingPage,
});

const SCHEDULABLE = ["Quoted", "Approved", "Scheduled", "In Progress", "Completed"];

function SchedulingPage() {
  const qc = useQueryClient();
  const jobs = useQuery(jobsQuery);
  const [edit, setEdit] = useState<JobWithBuilding | null>(null);
  const [form, setForm] = useState({ scheduled_date: "", assigned_crew: "", equipment: "", estimated_duration: "" });
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  if (jobs.isLoading) return <Loading />;
  const list = (jobs.data ?? []).filter((j) => SCHEDULABLE.includes(j.status));

  function open(j: JobWithBuilding) {
    setEdit(j);
    setForm({ scheduled_date: j.scheduled_date ?? j.requested_date ?? "", assigned_crew: j.assigned_crew ?? "", equipment: j.equipment ?? "", estimated_duration: j.estimated_duration?.toString() ?? "" });
  }
  async function save() {
    if (!edit) return;
    if (!form.scheduled_date) { toast.error("Choose a cleaning date"); return; }
    const { error } = await supabase.from("jobs").update({
      scheduled_date: form.scheduled_date, assigned_crew: form.assigned_crew.slice(0, 200) || null,
      equipment: form.equipment.slice(0, 300) || null, estimated_duration: form.estimated_duration ? Number(form.estimated_duration) : null,
    }).eq("id", edit.id);
    if (error) { toast.error(error.message); return; }
    if (["Quoted", "Approved"].includes(edit.status)) await updateJobStatus(edit, "Scheduled", `Scheduled for ${form.scheduled_date}`);
    toast.success("Schedule saved");
    setEdit(null);
    qc.invalidateQueries();
  }

  const first = month.getDay() === 0 ? 6 : month.getDay() - 1;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: first + days }, (_, i) => (i < first ? null : i - first + 1));
  const key = (d: number) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <>
      <PageHeader title="Scheduling" subtitle="Manual assignment of date, crew, equipment and duration. No automated flight planning." />
      <Panel>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Job</TableHead><TableHead>Building</TableHead><TableHead>City</TableHead><TableHead>Requested</TableHead><TableHead>Scheduled</TableHead><TableHead>Crew</TableHead><TableHead>Equipment</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {list.map((j) => (
                <TableRow key={j.id}>
                  <TableCell><Link to="/jobs/$jobId" params={{ jobId: j.id }} className="font-semibold text-primary hover:underline">{j.job_number}</Link></TableCell>
                  <TableCell>{j.buildings?.name}</TableCell><TableCell>{j.buildings?.city}</TableCell>
                  <TableCell>{j.requested_date ?? "—"}</TableCell><TableCell>{j.scheduled_date ?? "—"}</TableCell>
                  <TableCell className="max-w-40 truncate">{j.assigned_crew ?? "—"}</TableCell>
                  <TableCell className="max-w-48 truncate">{j.equipment ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={j.status} /></TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => open(j)}>Assign</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>

      <Panel className="mt-6" title={month.toLocaleDateString(undefined, { month: "long", year: "numeric" })} actions={
        <div className="flex gap-1">
          <Button size="icon" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="icon" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>}>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => (
            <div key={i} className="min-h-20 rounded-lg border bg-card p-1.5 text-xs">
              {d && <>
                <span className="text-muted-foreground">{d}</span>
                {list.filter((j) => j.scheduled_date === key(d)).map((j) => (
                  <Link key={j.id} to="/jobs/$jobId" params={{ jobId: j.id }} className="mt-1 block truncate rounded bg-primary-soft px-1 py-0.5 font-medium text-primary">{j.job_number}</Link>
                ))}
              </>}
            </div>
          ))}
        </div>
      </Panel>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule {edit?.job_number} · {edit?.buildings?.name}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Field label="Cleaning date"><Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} /></Field>
            <Field label="Operator / crew"><Input value={form.assigned_crew} onChange={(e) => setForm({ ...form, assigned_crew: e.target.value })} placeholder="Crew A (2 pilots, 1 ground)" /></Field>
            <Field label="Equipment"><Input value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} placeholder="Cleaning drone x2, tether, water unit" /></Field>
            <Field label="Estimated duration (days)"><Input type="number" min={0} step={0.5} value={form.estimated_duration} onChange={(e) => setForm({ ...form, estimated_duration: e.target.value })} /></Field>
          </div>
          <DialogFooter><Button onClick={save}>Save schedule</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
