import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SUITABILITY } from "@/lib/domain";

const STATUS_STYLE: Record<string, string> = {
  Submitted: "bg-muted text-muted-foreground",
  "Under Review": "bg-warning-soft text-warning-foreground",
  Quoted: "bg-primary-soft text-primary",
  Approved: "bg-teal-soft text-teal",
  Scheduled: "bg-primary-soft text-primary",
  "In Progress": "bg-warning-soft text-warning-foreground",
  Completed: "bg-success-soft text-success",
  Rejected: "bg-danger-soft text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", STATUS_STYLE[status] ?? "bg-muted")}>
      {status}
    </span>
  );
}

export function SuitabilityBadge({ result }: { result: string }) {
  const style =
    result === SUITABILITY.SUITABLE ? "bg-success-soft text-success border-success/30"
    : result === SUITABILITY.NOT ? "bg-danger-soft text-destructive border-destructive/30"
    : "bg-warning-soft text-warning-foreground border-warning/40";
  return <span className={cn("inline-flex rounded-md border px-2.5 py-1 text-xs font-bold tracking-wide", style)}>{result}</span>;
}

export function DemoTag() {
  return <span className="rounded border border-dashed border-warning px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning-foreground">Demo</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2 no-print">{actions}</div>}
    </div>
  );
}

export function Panel({ title, subtitle, children, className, actions }: { title?: string; subtitle?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("card-surface p-5 sm:p-6", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Notice({ children, tone = "warning" }: { children: ReactNode; tone?: "warning" | "info" }) {
  return (
    <div className={cn("rounded-xl px-4 py-3 text-sm", tone === "warning" ? "bg-warning-soft text-warning-foreground" : "bg-primary-soft text-primary")}>
      {children}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Loading() {
  return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>;
}
