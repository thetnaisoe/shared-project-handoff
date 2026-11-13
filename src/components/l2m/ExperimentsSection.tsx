import { useState, type FormEvent } from "react";
import { Check, LockKeyhole, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { ClaimBadge } from "@/components/ClaimBadge";
import { ClaimDrawer } from "@/components/ClaimDrawer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { Experiment, ExperimentRule, RunState } from "@/lib/contract";
import {
  METHOD_LABEL,
  claimById,
  formatAmount,
  formatPercent,
  rankedExperiments,
} from "@/lib/ledger";
import {
  buildGate2Decisions,
  draftFromExperiment,
  type ExperimentDraft,
  type Gate2Choice,
} from "./experiment-decisions";

interface ExperimentsSectionProps {
  state: RunState;
  onApproved: (state: RunState) => void;
}

export function ExperimentsSection({ state, onApproved }: ExperimentsSectionProps) {
  const experiments = rankedExperiments(state);
  const isGate2 = state.run.status === "awaiting_gate2";
  const [choices, setChoices] = useState<Record<string, Gate2Choice>>({});
  const [drafts, setDrafts] = useState<Record<string, ExperimentDraft>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openClaimId, setOpenClaimId] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(() =>
    String(state.run.assessment?.decision?.viability_threshold ?? ""),
  );
  const [isApproving, setIsApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const editingExperiment = experiments.find((experiment) => experiment.id === editingId);
  const allDecided =
    experiments.length > 0 && experiments.every((experiment) => choices[experiment.id]);
  const numericThreshold = Number(threshold);
  const validThreshold =
    threshold.trim() !== "" && Number.isFinite(numericThreshold) && numericThreshold >= 0;

  async function approvePlan() {
    if (!allDecided || !validThreshold || isApproving) return;
    setIsApproving(true);
    setApprovalError(null);
    try {
      const nextState = await api.approve(state.run.id, {
        gate: 2,
        approved: true,
        viability_threshold: numericThreshold,
        decisions: buildGate2Decisions(experiments, choices, drafts),
      });
      onApproved(nextState);
      toast.success("Experiment plan approved and rules locked.");
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : "The plan could not be approved.");
    } finally {
      setIsApproving(false);
    }
  }

  return (
    <section id="experiments" className="space-y-5 border-t pt-8">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold">Experiments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked tests for the assumptions most likely to change the verdict.
          </p>
        </div>
        {isGate2 && <Badge variant="secondary">Gate 2 · Review plan</Badge>}
      </div>

      {isGate2 && (
        <div className="rounded-lg border bg-card p-5">
          <Label htmlFor="viability-threshold">Viability threshold (€ per year)</Label>
          <Input
            id="viability-threshold"
            type="number"
            min="0"
            step="1000"
            required
            value={threshold}
            onChange={(event) => setThreshold(event.target.value)}
            className="mt-2 max-w-xs"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            The revenue in year five that would justify six months of work. Continue only if the
            chance of reaching it is at least 50%.
          </p>
          {(() => {
            const id = state.run.assessment?.market_model?.output_claim_id;
            const out = id ? claimById(state, id) : undefined;
            return out && out.p50 !== null ? (
              <p className="mt-1 text-sm font-medium">
                Model median: {formatAmount(out.p50, out.unit)}
              </p>
            ) : null;
          })()}
        </div>
      )}

      {experiments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No experiments have been proposed.</p>
      ) : (
        <div className="space-y-4">
          {experiments.map((experiment) => (
            <ExperimentCard
              key={experiment.id}
              state={state}
              experiment={experiment}
              isGate2={isGate2}
              choice={choices[experiment.id]}
              draft={drafts[experiment.id]}
              onChoose={(choice) =>
                setChoices((current) => ({ ...current, [experiment.id]: choice }))
              }
              onEdit={() => setEditingId(experiment.id)}
              onOpenClaim={() => setOpenClaimId(experiment.assumption_id)}
            />
          ))}
        </div>
      )}

      {isGate2 && (
        <div className="space-y-3 rounded-lg border bg-card p-5">
          {approvalError && (
            <Alert variant="destructive">
              <AlertDescription>{approvalError}</AlertDescription>
            </Alert>
          )}
          <Button
            type="button"
            onClick={approvePlan}
            disabled={!allDecided || !validThreshold || isApproving}
          >
            <LockKeyhole aria-hidden="true" />
            {isApproving ? "Approving plan…" : "Approve plan and lock rules"}
          </Button>
          {!allDecided && (
            <p className="text-sm text-muted-foreground">
              Choose Accept, Edit or Reject on every experiment to continue.
            </p>
          )}
        </div>
      )}

      <Dialog
        open={editingExperiment !== undefined}
        onOpenChange={(open) => !open && setEditingId(null)}
      >
        {editingExperiment && (
          <ExperimentEditor
            key={editingExperiment.id}
            experiment={editingExperiment}
            initialDraft={drafts[editingExperiment.id] ?? draftFromExperiment(editingExperiment)}
            onSave={(draft) => {
              setDrafts((current) => ({ ...current, [editingExperiment.id]: draft }));
              setChoices((current) => ({ ...current, [editingExperiment.id]: "edit" }));
              setEditingId(null);
            }}
          />
        )}
      </Dialog>

      {openClaimId && (
        <ClaimDrawer
          state={state}
          claimId={openClaimId}
          open
          onOpenChange={(open) => !open && setOpenClaimId(null)}
        />
      )}
    </section>
  );
}

interface ExperimentCardProps {
  state: RunState;
  experiment: Experiment;
  isGate2: boolean;
  choice?: Gate2Choice;
  draft?: ExperimentDraft;
  onChoose: (choice: Gate2Choice) => void;
  onEdit: () => void;
  onOpenClaim: () => void;
}

function ExperimentCard({
  state,
  experiment,
  isGate2,
  choice,
  draft,
  onChoose,
  onEdit,
  onOpenClaim,
}: ExperimentCardProps) {
  const claim = claimById(state, experiment.assumption_id);
  const showingDraft = choice === "edit" && draft;
  const hypothesis = showingDraft ? draft.hypothesis : experiment.hypothesis;
  const metric = showingDraft ? draft.metric : experiment.metric;

  return (
    <article className="space-y-5 rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto text-base font-semibold">{METHOD_LABEL[experiment.method]}</h3>
        {experiment.rank === 1 && <Badge>Run next</Badge>}
        {choice && (
          <Badge variant={choice === "reject" ? "destructive" : "secondary"}>
            {choice === "accept" ? "Accepted" : choice === "edit" ? "Edited" : "Rejected"}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hypothesis
          </h4>
          <p className="mt-1.5 text-sm leading-6">{hypothesis}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Metric
          </h4>
          <p className="mt-1.5 text-sm leading-6">{metric}</p>
        </div>
      </div>

      <div className="rounded-md border bg-muted/40 p-4">
        <h4 className="text-sm font-semibold">Rule fixed in advance</h4>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Pass threshold</dt>
            <dd className="mt-1 text-sm font-medium text-success">{experiment.pass_threshold}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Kill criterion</dt>
            <dd className="mt-1 text-sm font-medium text-destructive">
              {experiment.kill_criterion}
            </dd>
          </div>
        </dl>
        {showingDraft && (
          <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
            Edited rule: {draft.rule.trials} trials · pass at least {draft.rule.pass_at_least} ·
            fail below {draft.rule.fail_below} · on failure {draft.rule.on_fail}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Effort:</span>{" "}
          <strong>{experiment.effort_days} days</strong>
        </p>
        <p>
          <span className="text-muted-foreground">Cost:</span>{" "}
          <strong>{formatAmount(experiment.cost_eur, "EUR")}</strong>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">Tests:</span>
        <button
          type="button"
          onClick={onOpenClaim}
          className="rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`View tested claim${claim ? `: ${claim.text}` : ""}`}
        >
          {claim ? (
            <ClaimBadge claim={claim} />
          ) : (
            <Badge variant="outline">{experiment.assumption_id}</Badge>
          )}
        </button>
        {claim && (
          <span className="min-w-48 flex-1 text-xs text-muted-foreground">{claim.text}</span>
        )}
      </div>

      {experiment.decision_flip_prob !== null && (
        <p className="text-sm text-muted-foreground">
          Chance to change the verdict:{" "}
          <strong className="text-foreground">
            {formatPercent(experiment.decision_flip_prob)}
          </strong>
        </p>
      )}

      {isGate2 && (
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button
            type="button"
            size="sm"
            variant={choice === "accept" ? "default" : "outline"}
            onClick={() => onChoose("accept")}
          >
            <Check aria-hidden="true" /> Accept
          </Button>
          <Button
            type="button"
            size="sm"
            variant={choice === "edit" ? "default" : "outline"}
            onClick={onEdit}
          >
            <Pencil aria-hidden="true" /> Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant={choice === "reject" ? "destructive" : "outline"}
            onClick={() => onChoose("reject")}
          >
            <X aria-hidden="true" /> Reject
          </Button>
        </div>
      )}
    </article>
  );
}

interface ExperimentEditorProps {
  experiment: Experiment;
  initialDraft: ExperimentDraft;
  onSave: (draft: ExperimentDraft) => void;
}

function ExperimentEditor({ experiment, initialDraft, onSave }: ExperimentEditorProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [error, setError] = useState<string | null>(null);

  function updateRule<K extends keyof ExperimentRule>(key: K, value: ExperimentRule[K]) {
    setDraft((current) => ({ ...current, rule: { ...current.rule, [key]: value } }));
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { trials, pass_at_least, fail_below } = draft.rule;
    if (pass_at_least > trials || fail_below > trials || pass_at_least < fail_below) {
      setError(
        "Use whole numbers within the trial count, with pass at least greater than or equal to fail below.",
      );
      return;
    }
    onSave({
      hypothesis: draft.hypothesis.trim(),
      metric: draft.metric.trim(),
      rule: { ...draft.rule },
    });
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <form onSubmit={save} className="space-y-5">
        <DialogHeader>
          <DialogTitle>Edit experiment</DialogTitle>
          <DialogDescription>{METHOD_LABEL[experiment.method]}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor={`hypothesis-${experiment.id}`}>Hypothesis</Label>
          <Textarea
            id={`hypothesis-${experiment.id}`}
            required
            rows={4}
            value={draft.hypothesis}
            onChange={(event) =>
              setDraft((current) => ({ ...current, hypothesis: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`metric-${experiment.id}`}>Metric</Label>
          <Textarea
            id={`metric-${experiment.id}`}
            required
            rows={3}
            value={draft.metric}
            onChange={(event) =>
              setDraft((current) => ({ ...current, metric: event.target.value }))
            }
          />
        </div>

        <fieldset className="space-y-3 rounded-md border p-4">
          <legend className="px-1 text-sm font-semibold">Decision rule</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <RuleNumberInput
              id={`trials-${experiment.id}`}
              label="Trials"
              min={1}
              value={draft.rule.trials}
              onChange={(value) => updateRule("trials", value)}
            />
            <RuleNumberInput
              id={`pass-${experiment.id}`}
              label="Pass at least"
              value={draft.rule.pass_at_least}
              onChange={(value) => updateRule("pass_at_least", value)}
            />
            <RuleNumberInput
              id={`fail-${experiment.id}`}
              label="Fail below"
              value={draft.rule.fail_below}
              onChange={(value) => updateRule("fail_below", value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`on-fail-${experiment.id}`}>On failure</Label>
            <Select
              value={draft.rule.on_fail}
              onValueChange={(value) => updateRule("on_fail", value === "kill" ? "kill" : "pivot")}
            >
              <SelectTrigger id={`on-fail-${experiment.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pivot">Pivot</SelectItem>
                <SelectItem value="kill">Kill</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function RuleNumberInput({
  id,
  label,
  value,
  onChange,
  min = 0,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        required
        min={min}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
