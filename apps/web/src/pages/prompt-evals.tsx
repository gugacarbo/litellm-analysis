import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card.js";
import { Input } from "../components/ui/input.js";
import { PageLayout } from "../components/ui/page-layout.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table.js";
import type { EvalRunListItem } from "./prompt-evals/types.js";
import { usePromptEvalsPage } from "./prompt-evals/use-prompt-evals-page.js";
import {
  formatDuration,
  formatF1,
  formatTimestamp,
  statusVariant,
} from "./prompt-evals/utils.js";

export function PromptEvalsPage() {
  const {
    form,
    setForm,
    runsLoading,
    runsError,
    sortedRuns,
    total,
    detail,
    detailLoading,
    setSelectedRunId,
    startEval,
    isStarting,
    cancelEval,
    isCancelling,
  } = usePromptEvalsPage();

  return (
    <PageLayout
      title="Prompt Evals"
      subtitle="Evaluate category classification accuracy"
    >
      {/* New Run Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New Evaluation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Model</label>
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="litellm/gpt-4o"
              />
            </div>
            <div className="w-32">
              <label className="text-sm font-medium">Threshold</label>
              <Input
                type="number"
                step={0.05}
                min={0}
                max={1}
                value={form.threshold}
                onChange={(e) =>
                  setForm({
                    ...form,
                    threshold: parseFloat(e.target.value) || 0.8,
                  })
                }
              />
            </div>
            <Button
              onClick={() =>
                startEval({
                  model: form.model,
                  threshold: form.threshold,
                  cases: [],
                })
              }
              disabled={isStarting}
            >
              {isStarting ? "Starting..." : "Run Eval"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Run List */}
      <Card>
        <CardHeader>
          <CardTitle>History ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {runsLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : runsError ? (
            <p className="text-destructive">Failed to load runs</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Macro F1</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRuns.map((run: EvalRunListItem) => (
                  <TableRow
                    key={run.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedRunId(run.id)}
                  >
                    <TableCell>
                      <Badge variant={statusVariant(run.status)}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {run.model}
                    </TableCell>
                    <TableCell>{formatF1(run.macroF1)}</TableCell>
                    <TableCell>{formatTimestamp(run.startedAt)}</TableCell>
                    <TableCell>
                      {formatDuration(run.startedAt, run.finishedAt)}
                    </TableCell>
                    <TableCell>
                      {!["succeeded", "failed", "cancelled"].includes(
                        run.status,
                      ) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isCancelling}
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEval(run.id);
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Run Detail */}
      {detail && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Run {detail.id.slice(0, 8)}...</CardTitle>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <p>Loading details...</p>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Badge variant={statusVariant(detail.status)}>
                    {detail.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Macro F1: {formatF1(detail.macroF1)}
                  </span>
                  {detail.error && (
                    <span className="text-sm text-destructive">
                      {detail.error}
                    </span>
                  )}
                </div>

                {/* Step Timeline */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Steps</h4>
                  {detail.steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <Badge
                        variant={statusVariant(step.status)}
                        className="w-20 justify-center"
                      >
                        {step.status}
                      </Badge>
                      <span className="font-mono text-xs">{step.step}</span>
                      {step.message && (
                        <span className="text-muted-foreground">
                          {step.message}
                        </span>
                      )}
                      {step.progressPct > 0 && (
                        <span className="text-xs">{step.progressPct}%</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
