import type { RunState } from "@/lib/contract";

/**
 * Display title for a run page: the technology the idea was interpreted as,
 * falling back to a plain label when the run has no interpretation yet.
 * The run id is never shown to the user.
 */
export function runTitle(state: RunState): string {
  const technology = state.run.interpretation?.technology?.trim();
  return technology || "Your idea";
}
