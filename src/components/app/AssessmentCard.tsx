import { ShieldAlert } from "lucide-react";
import type { Assessment } from "@/lib/data";
import { SuitabilityBadge } from "./ui-bits";

type Analysis = { overview?: string; surface?: string; access?: string; dirt?: string; site_value?: string; benefits?: string[]; missing?: string[] };

export function AssessmentCard({ a }: { a: Assessment }) {
  const an = (a.analysis ?? {}) as Analysis;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SuitabilityBadge result={a.suitability_result} />
        <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
      </div>
      {an.overview && <p className="text-sm">{an.overview}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {[["Surface compatibility", an.surface], ["Access challenges", an.access], ["Dirt condition", an.dirt], ["Site & value", an.site_value]]
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="rounded-lg bg-muted p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k}</p>
              <p className="mt-1 text-sm">{v}</p>
            </div>
          ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <List title="Operational benefits" items={an.benefits} />
        <List title="Key risks" items={a.risks} />
        <List title="Missing information" items={an.missing} />
        <List title="Recommended next steps" items={a.recommendations} />
      </div>
      <div className="flex gap-2 rounded-lg border border-warning/40 bg-warning-soft p-3 text-xs text-warning-foreground">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Preliminary AI screening only. Not a flight authorisation or guarantee of cleaning quality. Qualified operator approval, site inspection, regulatory compliance and a safety assessment are always required.
      </div>
    </div>
  );
}

function List({ title, items }: { title: string; items?: string[] | null | undefined }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  );
}
