import { createFileRoute } from "@tanstack/react-router";
import { Page, PlaceholderCard } from "@/components/l2m/TopBar";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence — Lab2Markt" },
      { name: "description", content: "How Lab2Markt labels every statement as Fact, Estimate or Assumption." },
      { property: "og:title", content: "Evidence — Lab2Markt" },
      { property: "og:description", content: "How Lab2Markt labels every statement as Fact, Estimate or Assumption." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Page>
      <h1 className="text-2xl font-semibold">Evidence</h1>
      <div className="mt-6"><PlaceholderCard title="Evidence" detail="Evaluation results will go here." /></div>
    </Page>
  ),
});
