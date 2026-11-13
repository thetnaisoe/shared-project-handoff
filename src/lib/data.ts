import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Building = Database["public"]["Tables"]["buildings"]["Row"];
export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type JobWithBuilding = Job & { buildings: Building | null };
export type Assessment = Database["public"]["Tables"]["assessments"]["Row"];
export type Quotation = Database["public"]["Tables"]["quotations"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type Experiment = Database["public"]["Tables"]["experiments"]["Row"];
export type JobEvent = Database["public"]["Tables"]["job_events"]["Row"];

const unwrap = <T,>(r: { data: T | null; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
};

export const jobsQuery = queryOptions({
  queryKey: ["jobs"],
  queryFn: async () =>
    unwrap(await supabase.from("jobs").select("*, buildings(*)").order("created_at", { ascending: false })) as JobWithBuilding[],
});

export const jobQuery = (id: string) =>
  queryOptions({
    queryKey: ["job", id],
    queryFn: async () => {
      const job = unwrap(await supabase.from("jobs").select("*, buildings(*)").eq("id", id).single()) as JobWithBuilding;
      const [assessments, quotations, events, reports] = await Promise.all([
        supabase.from("assessments").select("*").eq("building_id", job.building_id).order("created_at", { ascending: false }),
        supabase.from("quotations").select("*").eq("job_id", id).order("created_at", { ascending: false }),
        supabase.from("job_events").select("*").eq("job_id", id).order("created_at", { ascending: false }),
        supabase.from("reports").select("*").eq("job_id", id).order("created_at", { ascending: false }),
      ]);
      return {
        job,
        assessments: unwrap(assessments) as Assessment[],
        quotations: unwrap(quotations) as Quotation[],
        events: unwrap(events) as JobEvent[],
        reports: unwrap(reports) as Report[],
      };
    },
  });

export const statsQuery = queryOptions({
  queryKey: ["stats"],
  queryFn: async () => {
    const [b, a, q] = await Promise.all([
      supabase.from("buildings").select("id", { count: "exact", head: true }),
      supabase.from("assessments").select("building_id"),
      supabase.from("quotations").select("id", { count: "exact", head: true }),
    ]);
    const assessed = new Set((unwrap(a) as { building_id: string }[]).map((x) => x.building_id)).size;
    return { buildings: b.count ?? 0, assessed, quotations: q.count ?? 0 };
  },
});

export const experimentsQuery = queryOptions({
  queryKey: ["experiments"],
  queryFn: async () => unwrap(await supabase.from("experiments").select("*").order("created_at")) as Experiment[],
});

export async function updateJobStatus(job: Pick<Job, "id" | "status">, to: string, note?: string) {
  unwrap(await supabase.from("jobs").update({ status: to }).eq("id", job.id).select().single());
  unwrap(await supabase.from("job_events").insert({ job_id: job.id, from_status: job.status, to_status: to, note: note ?? null }).select());
}

export function invalidateAll(qc: QueryClient) {
  return qc.invalidateQueries();
}

export async function uploadPhotos(files: File[], prefix: string) {
  const paths: string[] = [];
  for (const f of files) {
    const path = `${prefix}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("job-photos").upload(path, f, { contentType: f.type });
    if (error) throw new Error(error.message);
    paths.push(path);
  }
  return paths;
}

export async function signedUrls(paths: string[]) {
  if (!paths.length) return [];
  const { data, error } = await supabase.storage.from("job-photos").createSignedUrls(paths, 3600);
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
}
