import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { jobsQuery } from "@/lib/data";
import { eur, JOB_STATUSES } from "@/lib/domain";
import { pageHead } from "@/lib/head";
import { PageHeader, Panel, StatusBadge, DemoTag, Loading } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/jobs/")({
  head: pageHead("Job Management", "Review, approve and track drone façade cleaning jobs."),
  component: JobsPage,
});

function JobsPage() {
  const jobs = useQuery(jobsQuery);
  const [filter, setFilter] = useState<string>("All");
  if (jobs.isLoading) return <Loading />;
  const list = (jobs.data ?? []).filter((j) => filter === "All" || j.status === filter);
  return (
    <>
      <PageHeader title="Job Management" subtitle="Open a job to review, quote, approve and update its status." actions={<Button asChild><Link to="/assessment">New request</Link></Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        {["All", ...JOB_STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("rounded-full border px-3 py-1 text-xs font-medium", filter === s ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>{s}</button>
        ))}
      </div>
      <Panel>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Job</TableHead><TableHead>Building</TableHead><TableHead>City</TableHead><TableHead className="text-right">Area</TableHead><TableHead className="text-right">Quote</TableHead><TableHead>Requested</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {list.map((j) => (
                <TableRow key={j.id}>
                  <TableCell><Link to="/jobs/$jobId" params={{ jobId: j.id }} className="font-semibold text-primary hover:underline">{j.job_number}</Link></TableCell>
                  <TableCell><span className="flex items-center gap-2">{j.buildings?.name}{j.is_demo && <DemoTag />}</span></TableCell>
                  <TableCell>{j.buildings?.city}</TableCell>
                  <TableCell className="text-right">{Number(j.buildings?.exterior_area ?? 0).toLocaleString()} m²</TableCell>
                  <TableCell className="text-right">{eur(j.quoted_price)}</TableCell>
                  <TableCell>{j.requested_date ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={j.status} /></TableCell>
                </TableRow>
              ))}
              {!list.length && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No jobs with this status.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </>
  );
}
