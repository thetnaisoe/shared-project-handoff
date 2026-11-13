import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Info, Loader2 } from "lucide-react";
import { Page } from "@/components/l2m/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { countWords, MAX_WORDS, startRun } from "@/components/l2m/startRun";
import { cn } from "@/lib/utils";
import { usePresenterMode } from "@/components/l2m/presenter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "New idea — Lab2Markt" },
      {
        name: "description",
        content: "Describe a technical idea and get an honest commercial assessment.",
      },
      { property: "og:title", content: "New idea — Lab2Markt" },
      {
        property: "og:description",
        content: "Describe a technical idea and get an honest commercial assessment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Intake,
});

function Intake() {
  const navigate = useNavigate();
  const presenter = usePresenterMode();
  const [idea, setIdea] = useState("");
  const [sector, setSector] = useState("");
  const [region, setRegion] = useState("");
  const [trl, setTrl] = useState("");
  const [busy, setBusy] = useState(false);
  const words = countWords(idea);
  const tooLong = words > MAX_WORDS;
  const trlNum = trl === "" ? null : Number(trl);
  const trlBad = trlNum !== null && !(Number.isInteger(trlNum) && trlNum >= 1 && trlNum <= 9);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!words || tooLong || trlBad) return;
    setBusy(true);
    const id = await startRun({
      idea_text: idea.trim(),
      context: { sector: sector.trim() || null, region: region.trim() || null, trl: trlNum },
    });
    setBusy(false);
    if (id) navigate({ to: "/runs/$id", params: { id } });
  }

  return (
    <Page>
      <h1 className="text-2xl font-semibold">New idea</h1>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <div>
          <Label htmlFor="idea">Your idea</Label>
          <Textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={12}
            placeholder="Describe the technology, what it does, and who would pay for it."
            className="mt-1.5"
          />
          <p
            className={cn(
              "mt-1 text-right text-xs",
              tooLong ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {words.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="sector">Sector (optional)</Label>
            <Input
              id="sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="region">Region (optional)</Label>
            <Input
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="trl">TRL 1–9 (optional)</Label>
            <Input
              id="trl"
              type="number"
              min={1}
              max={9}
              step={1}
              value={trl}
              onChange={(e) => setTrl(e.target.value)}
              className="mt-1.5"
              aria-invalid={trlBad}
            />
            {trlBad && (
              <p className="mt-1 text-xs text-destructive">Enter a whole number from 1 to 9.</p>
            )}
          </div>
        </div>
        <p className="flex gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          We assess technical ideas that have identifiable business customers. We ask for more
          detail when an idea is too vague, and refuse ideas whose main use is harm or surveillance.
        </p>
        <Button type="submit" size="lg" disabled={busy || !words || tooLong || trlBad}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}Start
        </Button>
      </form>
      {presenter && (
        <p className="mt-8 text-sm text-muted-foreground">
          Demo runs:{" "}
          <Link to="/runs/$id" params={{ id: "demo-gate1" }} className="text-primary underline">
            demo-gate1
          </Link>
          {" · "}
          <Link to="/runs/$id" params={{ id: "demo-success" }} className="text-primary underline">
            demo-success
          </Link>
        </p>
      )}
    </Page>
  );
}
