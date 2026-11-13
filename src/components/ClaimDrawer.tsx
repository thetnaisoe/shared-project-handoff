import { StickyNote } from "lucide-react";
import { ClaimBadge } from "@/components/ClaimBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { RunState } from "@/lib/contract";
import { claimById, formatClaimValue } from "@/lib/ledger";

export interface ClaimDrawerProps {
  state: RunState;
  claimId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClaimDrawer({ state, claimId, open, onOpenChange }: ClaimDrawerProps) {
  const claim = claimById(state, claimId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {claim ? (
          <>
            <SheetHeader className="gap-4 pr-8 text-left">
              <SheetTitle>Claim details</SheetTitle>
              <SheetDescription>Evidence and context for this claim.</SheetDescription>
              <ClaimBadge claim={claim} />
            </SheetHeader>

            <div className="space-y-6 pt-2">
              <section aria-labelledby="claim-text-heading">
                <h3
                  id="claim-text-heading"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Claim
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {claim.text}
                </p>
              </section>

              <section aria-labelledby="claim-value-heading">
                <h3
                  id="claim-value-heading"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Value
                </h3>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {formatClaimValue(claim) ?? "No numeric value provided"}
                </p>
              </section>

              <section aria-labelledby="claim-evidence-heading" className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h3
                    id="claim-evidence-heading"
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Evidence strength
                  </h3>
                  <span className="text-sm font-semibold text-foreground">
                    {evidenceStrengthPercent(claim.evidence_strength)}%
                  </span>
                </div>
                <Progress
                  value={evidenceStrengthPercent(claim.evidence_strength)}
                  className="bg-muted"
                  aria-label="Evidence strength"
                />
              </section>

              {claim.sensitivity !== null && (
                <section
                  aria-labelledby="claim-sensitivity-heading"
                  className="rounded-lg bg-muted p-4"
                >
                  <h3
                    id="claim-sensitivity-heading"
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Sensitivity
                  </h3>
                  <p className="mt-1 text-sm font-medium text-foreground">{claim.sensitivity}</p>
                </section>
              )}

              {claim.note && (
                <Alert className="bg-muted">
                  <StickyNote className="h-4 w-4" aria-hidden="true" />
                  <AlertTitle>Note</AlertTitle>
                  <AlertDescription className="whitespace-pre-wrap leading-6">
                    {claim.note}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        ) : (
          <SheetHeader className="pr-8 text-left">
            <SheetTitle>Claim not found</SheetTitle>
            <SheetDescription>The requested claim is not part of this run.</SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}

function evidenceStrengthPercent(strength: number) {
  if (!Number.isFinite(strength)) return 0;
  return Math.round(Math.min(1, Math.max(0, strength)) * 100);
}
