import { prisma as litellmPrisma } from "@lite-llm/litellm-repository";
import {
  disconnectModelProxyPrisma,
  getModelProxyPrisma,
  type PrismaClient as ModelProxyPrismaClient,
  type Prisma,
} from "@lite-llm/model-proxy-repository";
import {
  legacyErrorRowFromPrisma,
  legacySpendRowFromCloudJson,
  legacySpendRowFromPrisma,
  type MappedProxyRequestWrite,
  type ModelCostRates,
  mapLegacySpendToProxyRequest,
  shouldSkipExistingRow,
} from "../adapters/legacy-spend-adapter.js";
import {
  type CloudSpendImportOptions,
  type CloudSpendImportSummary,
  createEmptyCloudSpendSummary,
  createEmptyHistoryPhaseCounts,
  createEmptyHistorySummary,
  type HistoryImportOptions,
  type HistoryImportSummary,
  mergeHistoryPhaseCounts,
} from "./history-import-summary.js";

const SPEND_IMPORT_SOURCE = "litellm-spend";
const ERROR_IMPORT_SOURCE = "litellm-errors";

function logAction(message: string, dryRun: boolean): void {
  console.log(dryRun ? `[dry-run] ${message}` : message);
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function loadModelRates(
  target: ModelProxyPrismaClient,
): Promise<Map<string, ModelCostRates>> {
  const rows = await target.modelProxyModel.findMany({
    select: {
      modelName: true,
      inputCostPerToken: true,
      outputCostPerToken: true,
    },
  });

  return new Map(
    rows.map((row) => [
      row.modelName,
      {
        inputCostPerToken: row.inputCostPerToken,
        outputCostPerToken: row.outputCostPerToken,
      },
    ]),
  );
}

async function loadErrorRowsByRequestIds(
  requestIds: string[],
): Promise<Map<string, ReturnType<typeof legacyErrorRowFromPrisma>>> {
  if (requestIds.length === 0) {
    return new Map();
  }

  const rows = await litellmPrisma.liteLLM_ErrorLogs.findMany({
    where: { request_id: { in: requestIds } },
  });

  return new Map(
    rows.map((row) => [row.request_id, legacyErrorRowFromPrisma(row)]),
  );
}

async function writeMappedRequest(
  target: ModelProxyPrismaClient,
  mapped: MappedProxyRequestWrite,
  options: { dryRun: boolean; force: boolean },
): Promise<"imported" | "skipped"> {
  const existing = await target.modelProxyRequest.findUnique({
    where: { id: mapped.request.id as string },
    select: { id: true, status: true, errorDetails: true },
  });

  if (existing && shouldSkipExistingRow(existing, options.force)) {
    logAction(
      `skip request ${mapped.request.id} (existing non-import row)`,
      options.dryRun,
    );
    return "skipped";
  }

  if (existing) {
    logAction(`update request ${mapped.request.id}`, options.dryRun);
    if (!options.dryRun) {
      const { id: _id, ...updateData } = mapped.request;
      await target.modelProxyRequest.update({
        where: { id: mapped.request.id as string },
        data: updateData as Prisma.ModelProxyRequestUpdateInput,
      });
      await target.modelProxyMessage.deleteMany({
        where: { requestId: mapped.request.id as string },
      });
      if (mapped.messages.length > 0) {
        await target.modelProxyMessage.createMany({ data: mapped.messages });
      }
    }
    return "imported";
  }

  logAction(`insert request ${mapped.request.id}`, options.dryRun);
  if (!options.dryRun) {
    await target.modelProxyRequest.create({ data: mapped.request });
    if (mapped.messages.length > 0) {
      await target.modelProxyMessage.createMany({ data: mapped.messages });
    }
  }
  return "imported";
}

async function importSpendPhase(
  target: ModelProxyPrismaClient,
  options: HistoryImportOptions,
  summary: HistoryImportSummary,
): Promise<void> {
  const counts = createEmptyHistoryPhaseCounts();
  const modelRates = await loadModelRates(target);
  let cursor: string | undefined;

  while (true) {
    const rows = await litellmPrisma.liteLLM_SpendLogs.findMany({
      take: options.batchSize,
      ...(cursor
        ? {
            skip: 1,
            cursor: { request_id: cursor },
          }
        : {}),
      orderBy: { request_id: "asc" },
    });

    if (rows.length === 0) {
      break;
    }

    const errorByRequestId = await loadErrorRowsByRequestIds(
      rows.map((row) => row.request_id),
    );

    for (const row of rows) {
      try {
        const spend = legacySpendRowFromPrisma(row);
        const error = errorByRequestId.get(row.request_id) ?? null;
        const rates = modelRates.get(spend.model);
        const mapped = mapLegacySpendToProxyRequest({
          spend,
          error,
          modelRates: rates,
        });
        const result = await writeMappedRequest(target, mapped, options);
        counts[result] += 1;
      } catch (error) {
        counts.errors += 1;
        summary.warnings.push(
          `Spend row "${row.request_id}" failed: ${formatError(error)}`,
        );
      }
    }

    cursor = rows[rows.length - 1]?.request_id;
    if (rows.length < options.batchSize) {
      break;
    }
  }

  mergeHistoryPhaseCounts(summary, "spend", counts);
}

async function importErrorsPhase(
  target: ModelProxyPrismaClient,
  options: HistoryImportOptions,
  summary: HistoryImportSummary,
): Promise<void> {
  const counts = createEmptyHistoryPhaseCounts();
  const modelRates = await loadModelRates(target);
  let cursor: string | undefined;

  while (true) {
    const rows = await litellmPrisma.liteLLM_ErrorLogs.findMany({
      take: options.batchSize,
      ...(cursor
        ? {
            skip: 1,
            cursor: { request_id: cursor },
          }
        : {}),
      orderBy: { request_id: "asc" },
    });

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      try {
        const existingSpend = await litellmPrisma.liteLLM_SpendLogs.findUnique({
          where: { request_id: row.request_id },
          select: { request_id: true },
        });

        if (existingSpend) {
          counts.skipped += 1;
          continue;
        }

        const error = legacyErrorRowFromPrisma(row);
        const rates = modelRates.get(
          error.modelGroup || error.litellmModelName,
        );
        const mapped = mapLegacySpendToProxyRequest({
          error,
          modelRates: rates,
        });
        const result = await writeMappedRequest(target, mapped, options);
        counts[result] += 1;
      } catch (error) {
        counts.errors += 1;
        summary.warnings.push(
          `Error row "${row.request_id}" failed: ${formatError(error)}`,
        );
      }
    }

    cursor = rows[rows.length - 1]?.request_id;
    if (rows.length < options.batchSize) {
      break;
    }
  }

  mergeHistoryPhaseCounts(summary, "errors", counts);
}

export async function runHistoryImport(
  options: HistoryImportOptions,
): Promise<HistoryImportSummary> {
  const summary = createEmptyHistorySummary();
  const target = getModelProxyPrisma();
  let jobId: string | null = null;

  try {
    if (!options.dryRun) {
      const job = await target.modelProxyImportJob.create({
        data: {
          source: options.only.has("spend")
            ? SPEND_IMPORT_SOURCE
            : ERROR_IMPORT_SOURCE,
          status: "running",
        },
      });
      jobId = job.id;
    } else {
      console.log("[dry-run] skipping model_proxy_import_jobs row creation");
    }

    if (options.only.has("spend")) {
      await importSpendPhase(target, options, summary);
    }

    if (options.only.has("errors")) {
      await importErrorsPhase(target, options, summary);
    }

    if (jobId) {
      await target.modelProxyImportJob.update({
        where: { id: jobId },
        data: {
          status: summary.errors > 0 ? "failed" : "completed",
          finishedAt: new Date(),
          summary: {
            imported: summary.imported,
            skipped: summary.skipped,
            errors: summary.errors,
            phases: summary.phases,
          } as unknown as Prisma.InputJsonValue,
          error:
            summary.errors > 0
              ? `${summary.errors} row-level error(s) during import`
              : null,
        },
      });
    }

    return summary;
  } catch (error) {
    if (jobId) {
      await target.modelProxyImportJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          finishedAt: new Date(),
          summary: {
            imported: summary.imported,
            skipped: summary.skipped,
            errors: summary.errors,
            phases: summary.phases,
          } as unknown as Prisma.InputJsonValue,
          error: formatError(error),
        },
      });
    }

    throw error;
  } finally {
    await litellmPrisma.$disconnect();
    await disconnectModelProxyPrisma();
  }
}

export async function importCloudSpendLogs(
  logs: Record<string, unknown>[],
  options: CloudSpendImportOptions,
): Promise<CloudSpendImportSummary> {
  const summary = createEmptyCloudSpendSummary();
  const target = getModelProxyPrisma();
  const modelRates = await loadModelRates(target);
  let jobId: string | null = null;

  try {
    if (!options.dryRun) {
      const job = await target.modelProxyImportJob.create({
        data: {
          source: options.source,
          status: "running",
        },
      });
      jobId = job.id;
    }

    for (const rawLog of logs) {
      try {
        const spend = legacySpendRowFromCloudJson(rawLog);
        if (!spend) {
          summary.warnings.push(
            "Skipped cloud log without request_id/startTime",
          );
          summary.skipped += 1;
          continue;
        }

        const rates = modelRates.get(spend.model);
        const mapped = mapLegacySpendToProxyRequest({
          spend,
          modelRates: rates,
        });
        const result = await writeMappedRequest(target, mapped, {
          dryRun: options.dryRun,
          force: options.force,
        });
        summary[result] += 1;
      } catch (error) {
        summary.errors += 1;
        summary.warnings.push(formatError(error));
      }
    }

    if (jobId) {
      await target.modelProxyImportJob.update({
        where: { id: jobId },
        data: {
          status: summary.errors > 0 ? "failed" : "completed",
          finishedAt: new Date(),
          summary: {
            imported: summary.imported,
            skipped: summary.skipped,
            errors: summary.errors,
          } as unknown as Prisma.InputJsonValue,
          error:
            summary.errors > 0
              ? `${summary.errors} row-level error(s) during cloud import`
              : null,
        },
      });
    }

    return summary;
  } catch (error) {
    if (jobId) {
      await target.modelProxyImportJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          finishedAt: new Date(),
          summary: {
            imported: summary.imported,
            skipped: summary.skipped,
            errors: summary.errors,
          } as unknown as Prisma.InputJsonValue,
          error: formatError(error),
        },
      });
    }

    throw error;
  } finally {
    await disconnectModelProxyPrisma();
  }
}

export function printHistoryImportSummary(summary: HistoryImportSummary): void {
  console.log("\nHistory import summary:");
  console.log(
    `  imported=${summary.imported} skipped=${summary.skipped} errors=${summary.errors}`,
  );

  if (summary.warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of summary.warnings) {
      console.log(`  - ${warning}`);
    }
  }
}
