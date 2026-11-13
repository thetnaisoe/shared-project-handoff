import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { screenFor, isWorking } from "@/lib/ledger";
import { Page, PlaceholderCard } from "@/components/l2m/TopBar";
import { AssessmentScreen } from "@/components/l2m/AssessmentScreen";

const runQuery = (id: string) =>
  queryOptions({
    queryKey: ["run", id],
    queryFn: () => api.getRun(id),
    refetchInterval: (q) => (q.state.data && isWorking(q.state.data.run.status) ? 2000 : false),
  });

export const Route = createFileRoute("/runs/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Run ${params.id} — Lab to Market` },
      { name: "description", content: "Progress and assessment for a Lab to Market run." },
      { property: "og:title", content: `Run ${params.id} — Lab to Market` },
      { property: "og:description", content: "Progress and assessment for a Lab to Market run." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RunPage,
});

const TITLES = {
  progress: "Progress",
  needs_input: "Needs input",
  refused: "Refused",
  gate1: "Gate 1 · Review interpretation",
  assessment: "Assessment",
  failed: "Failed",
} as const;

function RunPage() {
  const { id } = Route.useParams();
  const q = useQuery(runQuery(id));
  return (
    <Page>
      <h1 className="text-2xl font-semibold">Run {id}</h1>
      <div className="mt-6">
        {q.isPending ? (
          <p role="status" className="text-sm text-muted-foreground">Loading run…</p>
        ) : q.error ? (
          <PlaceholderCard title="Could not load run" detail={q.error.message} />
        ) : screenFor(q.data.run.status) === "assessment" ? (
          <AssessmentScreen state={q.data} />
        ) : (
          <PlaceholderCard title={TITLES[screenFor(q.data.run.status)]} detail={`run.status: ${q.data.run.status}`} />
        )}
      </div>
    </Page>
  );
}
