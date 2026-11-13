import type { ReactNode } from "react";
import { Calculator, CheckCircle, HelpCircle, type LucideIcon } from "lucide-react";
import type { Claim, ClaimType } from "@/lib/contract";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<ClaimType, { label: string; icon: LucideIcon; className: string }> = {
  fact: {
    label: "Fact",
    icon: CheckCircle,
    className: "border-transparent bg-success text-success-foreground",
  },
  estimate: {
    label: "Estimate",
    icon: Calculator,
    className: "claim-badge-estimate border-transparent text-info-foreground",
  },
  assumption: {
    label: "Assumption",
    icon: HelpCircle,
    className: "border-warning bg-transparent text-warning-foreground",
  },
};

export interface ClaimBadgeProps {
  claim: Claim;
  className?: string;
}

export function ClaimBadge({ claim, className }: ClaimBadgeProps) {
  const type = TYPE_STYLES[claim.type];
  const Icon = type.icon;
  // Older run payloads can include experiment origins not yet present in ClaimOrigin.
  const origin: string = claim.origin;

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold",
          type.className,
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {type.label}
      </span>

      {origin === "user" && (
        <ExtraTag className="border-transparent bg-muted text-muted-foreground">
          User-supplied
        </ExtraTag>
      )}
      {origin === "experiment" && (
        <ExtraTag className="border-transparent bg-experiment text-experiment-foreground">
          Team result
        </ExtraTag>
      )}
      {claim.text.includes("MOCKED") && (
        <ExtraTag className="border-transparent bg-destructive text-destructive-foreground">
          MOCKED
        </ExtraTag>
      )}
    </span>
  );
}

function ExtraTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}
