import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, PlaceholderCard } from "@/components/l2m/TopBar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "New idea — Lab to Market" },
      { name: "description", content: "Describe a technical idea and get an honest commercial assessment." },
      { property: "og:title", content: "New idea — Lab to Market" },
      { property: "og:description", content: "Describe a technical idea and get an honest commercial assessment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Intake,
});

function Intake() {
  return (
    <Page>
      <h1 className="text-2xl font-semibold">New idea</h1>
      <div className="mt-6"><PlaceholderCard title="Intake" detail="The idea form will go here." /></div>
      <p className="mt-6 text-sm text-muted-foreground">
        Demo runs:{" "}
        <Link to="/runs/$id" params={{ id: "demo-gate1" }} className="text-primary underline">demo-gate1</Link>
        {" · "}
        <Link to="/runs/$id" params={{ id: "demo-success" }} className="text-primary underline">demo-success</Link>
      </p>
    </Page>
  );
}
