import { randomUUID } from "node:crypto";
import {
  failOrphanedRuns,
  failOrphanedSteps,
  getEvalRun,
  getEvalRunArtifacts,
  getEvalRunSteps,
  insertEvalRun,
  insertEvalRunArtifact,
  insertEvalRunStep,
  listEvalRuns,
  type NewEvalRun,
  type NewEvalRunArtifact,
  type NewEvalRunStep,
  updateEvalRun,
  updateEvalRunStep,
} from "@lite-llm/app-repository";
import type {
  CategoryDefinition,
  CategoryEvalCase,
  EvalEvent,
  PromptEvalAdapter,
} from "@lite-llm/prompt-eval";
import {
  runCategoryAiReview,
  runCategoryEvaluation,
} from "@lite-llm/prompt-eval";
import type { WebSocketServer } from "../ws/websocket-server";

export interface PromptEvalAppServiceOptions {
  adapter: PromptEvalAdapter;
  wsServer: WebSocketServer;
  categories: CategoryDefinition[];
  reportsDir: string;
}

interface ActiveRun {
  runId: string;
  controller: AbortController;
}

function toTitleCase(value: string): string {
  return value
    .split(/[_\-\s]+/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveCategories(
  baseCategories: CategoryDefinition[],
  cases: CategoryEvalCase[],
): CategoryDefinition[] {
  const byId = new Map(
    baseCategories.map((category) => [category.id, category]),
  );
  const ordered = [...baseCategories];

  const caseCategoryIds = new Set<string>();
  for (const evalCase of cases) {
    for (const categoryId of evalCase.expectedCategories) {
      caseCategoryIds.add(categoryId);
    }
  }

  for (const categoryId of caseCategoryIds) {
    if (byId.has(categoryId)) {
      continue;
    }

    ordered.push({
      id: categoryId,
      name: toTitleCase(categoryId),
      description: `Auto-generated category for "${categoryId}".`,
    });
  }

  return ordered;
}

export function createPromptEvalApplicationService(
  opts: PromptEvalAppServiceOptions,
) {
  const activeRuns = new Map<string, ActiveRun>();
  const stepIdsByRun = new Map<string, Map<string, number>>();

  // Fail orphaned runs from previous server instance
  failOrphanedRuns();
  failOrphanedSteps();

  function broadcastRunUpdate(
    runId: string,
    step: string,
    status: string,
    progressPct: number,
    message: string | null,
  ) {
    opts.wsServer.broadcast({
      type: "prompt_eval_run_update",
      data: { runId, step, status, progressPct, message },
    });
  }

  function broadcastRunCompleted(
    runId: string,
    status: string,
    macroF1: number | null,
    error: string | null,
  ) {
    opts.wsServer.broadcast({
      type: "prompt_eval_run_completed",
      data: { runId, status, macroF1, error },
    });
  }

  function setStepId(runId: string, step: string, stepId: number): void {
    const runSteps = stepIdsByRun.get(runId) ?? new Map<string, number>();
    runSteps.set(step, stepId);
    stepIdsByRun.set(runId, runSteps);
  }

  function getStepId(runId: string, step: string): number | undefined {
    return stepIdsByRun.get(runId)?.get(step);
  }

  function clearStepId(runId: string, step: string): void {
    const runSteps = stepIdsByRun.get(runId);
    if (!runSteps) {
      return;
    }

    runSteps.delete(step);
    if (runSteps.size === 0) {
      stepIdsByRun.delete(runId);
    }
  }

  async function finalizeRunningSteps(
    runId: string,
    status: "completed" | "failed",
    message: string | null,
  ): Promise<void> {
    const now = new Date();
    const steps = await getEvalRunSteps(runId);

    for (const step of steps) {
      if (step.status !== "running") {
        continue;
      }

      await updateEvalRunStep(step.id, {
        status,
        finishedAt: now,
        progressPct: status === "completed" ? 100 : step.progressPct,
        message: message ?? step.message,
      });
    }
  }

  async function startRun(
    model: string,
    threshold: number,
    cases: CategoryEvalCase[],
  ): Promise<{ id: string }> {
    const runId = randomUUID();
    const now = new Date();

    const run: NewEvalRun = {
      id: runId,
      type: "category_eval",
      status: "queued",
      model,
      macroF1: null,
      threshold,
      error: null,
      startedAt: now,
      finishedAt: null,
    };
    await insertEvalRun(run);

    const controller = new AbortController();
    activeRuns.set(runId, { runId, controller });
    const categories = resolveCategories(opts.categories, cases);

    // Fire-and-forget the full pipeline
    void executeRun(
      runId,
      model,
      threshold,
      categories,
      cases,
      controller.signal,
    );

    return { id: runId };
  }

  async function executeRun(
    runId: string,
    model: string,
    threshold: number,
    categories: CategoryDefinition[],
    cases: CategoryEvalCase[],
    signal: AbortSignal,
  ): Promise<void> {
    try {
      await updateEvalRun(runId, { status: "loading_dataset" });
      signal.throwIfAborted();

      // Run evaluation with event bridge
      const report = await runCategoryEvaluation(
        {
          runId,
          categories,
          cases,
          model,
          threshold,
          signal,
          adapter: opts.adapter,
        } as Parameters<typeof runCategoryEvaluation>[0],
        (event: EvalEvent) => handleEvalEvent(runId, event),
      );

      signal.throwIfAborted();

      // Gate: macroF1 >= threshold
      const passed = report.metrics.macroF1 >= threshold;
      if (!passed) {
        await finalizeRunningSteps(runId, "completed", null);
        await updateEvalRun(runId, {
          status: "failed",
          macroF1: report.metrics.macroF1,
          error: `macroF1 ${report.metrics.macroF1.toFixed(4)} < threshold ${threshold}`,
          finishedAt: new Date(),
        });
        broadcastRunCompleted(
          runId,
          "failed",
          report.metrics.macroF1,
          "macroF1 below threshold",
        );
        return;
      }

      // AI Review (non-blocking for gate, but we run it)
      await updateEvalRun(runId, { status: "reviewing" });
      signal.throwIfAborted();

      const review = await runCategoryAiReview(
        {
          adapter: opts.adapter,
          categories,
          predictions: report.predictions,
          model,
          signal,
        },
        (event: EvalEvent) => handleEvalEvent(runId, event),
      );

      // Generate reports
      await updateEvalRun(runId, { status: "reporting" });
      await generateReports(runId, report, review);

      // Mark succeeded
      await finalizeRunningSteps(runId, "completed", null);
      await updateEvalRun(runId, {
        status: "succeeded",
        macroF1: report.metrics.macroF1,
        finishedAt: new Date(),
      });
      broadcastRunCompleted(runId, "succeeded", report.metrics.macroF1, null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isAbort =
        (err instanceof DOMException && err.name === "AbortError") ||
        message.toLowerCase().includes("abort");

      await updateEvalRun(runId, {
        status: isAbort ? "cancelled" : "failed",
        error: isAbort ? "cancelled by user" : message,
        finishedAt: new Date(),
      });
      finalizeRunningSteps(
        runId,
        "failed",
        isAbort ? "cancelled by user" : message,
      );
      broadcastRunCompleted(
        runId,
        isAbort ? "cancelled" : "failed",
        null,
        message,
      );
    } finally {
      activeRuns.delete(runId);
      stepIdsByRun.delete(runId);
    }
  }

  async function handleEvalEvent(runId: string, event: EvalEvent): Promise<void> {
    const now = new Date();

    switch (event.type) {
      case "step:start": {
        const step: NewEvalRunStep = {
          runId,
          step: event.step,
          status: "running",
          startedAt: now,
          finishedAt: null,
          message: event.message,
          progressPct: 0,
        };
        const insertedStep = await insertEvalRunStep(step);
        setStepId(runId, event.step, insertedStep.id);
        broadcastRunUpdate(runId, event.step, "running", 0, event.message);
        break;
      }
      case "step:progress": {
        const stepId = getStepId(runId, event.step);
        if (stepId !== undefined) {
          await updateEvalRunStep(stepId, {
            progressPct: event.progressPct,
            message: event.message,
          });
        }
        broadcastRunUpdate(
          runId,
          event.step,
          "running",
          event.progressPct,
          event.message,
        );
        break;
      }
      case "step:end": {
        const stepId = getStepId(runId, event.step);
        if (stepId !== undefined) {
          await updateEvalRunStep(stepId, {
            status: "completed",
            progressPct: 100,
            finishedAt: now,
          });
        }
        clearStepId(runId, event.step);
        break;
      }
      case "run:completed": {
        break;
      }
      case "run:failed": {
        break;
      }
    }
  }

  async function generateReports(
    runId: string,
    report: Awaited<ReturnType<typeof runCategoryEvaluation>>,
    review: Awaited<ReturnType<typeof runCategoryAiReview>>,
  ): Promise<void> {
    const fs = await import("node:fs/promises");
    const pathMod = await import("node:path");

    const runDir = pathMod.join(opts.reportsDir, runId);
    await fs.mkdir(runDir, { recursive: true });

    // Eval JSON
    const evalJsonPath = pathMod.join(runDir, "category-eval.json");
    await fs.writeFile(evalJsonPath, JSON.stringify(report, null, 2));
    await insertEvalRunArtifact({
      runId,
      kind: "eval_report_json",
      path: evalJsonPath,
      summaryJson: JSON.stringify({
        macroF1: report.metrics.macroF1,
        accuracy: report.metrics.accuracy,
      }),
    } as NewEvalRunArtifact);

    // Eval Markdown
    const evalMdPath = pathMod.join(runDir, "category-eval.md");
    const md = generateMarkdownReport(report);
    await fs.writeFile(evalMdPath, md);
    await insertEvalRunArtifact({
      runId,
      kind: "eval_report_md",
      path: evalMdPath,
      summaryJson: null,
    } as NewEvalRunArtifact);

    // Review JSON
    const reviewJsonPath = pathMod.join(runDir, "category-review.json");
    await fs.writeFile(reviewJsonPath, JSON.stringify(review, null, 2));
    await insertEvalRunArtifact({
      runId,
      kind: "review_report_json",
      path: reviewJsonPath,
      summaryJson: JSON.stringify({
        findingsCount: review.findings.length,
        suggestionsCount: review.suggestions.length,
      }),
    } as NewEvalRunArtifact);

    // Review Markdown
    const reviewMdPath = pathMod.join(runDir, "category-review.md");
    const reviewMd = generateReviewMarkdown(review);
    await fs.writeFile(reviewMdPath, reviewMd);
    await insertEvalRunArtifact({
      runId,
      kind: "review_report_md",
      path: reviewMdPath,
      summaryJson: null,
    } as NewEvalRunArtifact);
  }

  function generateMarkdownReport(
    report: Awaited<ReturnType<typeof runCategoryEvaluation>>,
  ): string {
    const lines: string[] = [];
    lines.push("# Category Evaluation Report");
    lines.push("");
    lines.push(`- **Run ID:** ${report.runId}`);
    lines.push(`- **Model:** ${report.model}`);
    lines.push(`- **Threshold:** ${report.threshold}`);
    lines.push(
      `- **Accuracy:** ${(report.metrics.accuracy * 100).toFixed(1)}%`,
    );
    lines.push(`- **Macro F1:** ${report.metrics.macroF1.toFixed(4)}`);
    lines.push(`- **Hamming Loss:** ${report.metrics.hammingLoss.toFixed(4)}`);
    lines.push("");
    lines.push("## Per-Label Metrics");
    lines.push("");
    lines.push("| Label | Precision | Recall | F1 | Support |");
    lines.push("|-------|-----------|--------|----|---------|");
    for (const [label, m] of Object.entries(report.metrics.perLabel)) {
      lines.push(
        `| ${label} | ${m.precision.toFixed(3)} | ${m.recall.toFixed(3)} | ${m.f1.toFixed(3)} | ${m.support} |`,
      );
    }
    lines.push("");
    lines.push("## Predictions");
    lines.push("");
    for (const p of report.predictions) {
      const icon = p.correct ? "✓" : "✗";
      lines.push(
        `- ${icon} **${p.caseId}** — expected: [${p.expected.join(", ")}] → predicted: [${p.predicted.join(", ")}]`,
      );
    }
    return lines.join("\n");
  }

  function generateReviewMarkdown(
    review: Awaited<ReturnType<typeof runCategoryAiReview>>,
  ): string {
    const lines: string[] = [];
    lines.push("# AI Review Report");
    lines.push("");
    lines.push(
      `**Findings:** ${review.findings.length} | **Suggestions:** ${review.suggestions.length}`,
    );
    lines.push("");
    lines.push("## Findings");
    lines.push("");
    for (const f of review.findings) {
      lines.push(`### ${f.assessment.toUpperCase()}: ${f.caseId}`);
      lines.push(`- Input: "${f.input}"`);
      lines.push(`- Expected: [${f.expected.join(", ")}]`);
      lines.push(`- Predicted: [${f.predicted.join(", ")}]`);
      lines.push(`- Reasoning: ${f.reasoning}`);
      lines.push("");
    }
    if (review.suggestions.length > 0) {
      lines.push("## Suggestions");
      lines.push("");
      for (const s of review.suggestions) {
        lines.push(`### ${s.categoryId}`);
        lines.push(`- Current: "${s.currentDescription}"`);
        lines.push(`- Suggested: "${s.suggestedDescription}"`);
        lines.push(`- Rationale: ${s.rationale}`);
        lines.push("");
      }
    }
    return lines.join("\n");
  }

  function cancelRun(runId: string): boolean {
    const active = activeRuns.get(runId);
    if (!active) return false;
    active.controller.abort();
    return true;
  }

  return {
    startRun,
    listRuns,
    getRunDetails,
    getRunArtifacts: (runId: string) => getEvalRunArtifacts(runId),
    cancelRun,
  };
}

function listRuns(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  return listEvalRuns(pageSize, offset);
}

function getRunDetails(id: string) {
  const run = getEvalRun(id);
  if (!run) return null;
  const steps = getEvalRunSteps(id);
  return { ...run, steps };
}
