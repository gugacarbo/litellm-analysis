import { prisma as litellmPrisma } from "@lite-llm/litellm-repository";
import {
  disconnectModelProxyPrisma,
  getModelProxyPrisma,
  type PrismaClient as ModelProxyPrismaClient,
} from "@lite-llm/model-proxy-repository";
import {
  buildSettingsRows,
  readLegacyConfigSource,
} from "../adapters/legacy-config-adapter.js";
import {
  type LegacyCredentialRow,
  mapLegacyCredential,
} from "../adapters/legacy-credentials-adapter.js";
import {
  dedupeLegacyModels,
  toModelProxyRow,
} from "../adapters/legacy-models-adapter.js";
import {
  createEmptyPhaseCounts,
  createEmptySummary,
  type ImportLegacyOptions,
  type ImportPhase,
  type ImportSummary,
  mergePhaseCounts,
  type PhaseCounts,
} from "./import-summary.js";

const IMPORT_SOURCE = "litellm-operational";

async function queryLiteLLMConfig(
  paramName: string,
): Promise<{ param_value: unknown } | undefined> {
  const row = await litellmPrisma.liteLLM_Config.findUnique({
    where: { param_name: paramName },
    select: { param_value: true },
  });

  if (!row) {
    return undefined;
  }

  return { param_value: row.param_value };
}

async function readLegacyCredentials(): Promise<LegacyCredentialRow[]> {
  const rows = await litellmPrisma.liteLLM_CredentialsTable.findMany({
    orderBy: { credential_name: "asc" },
    select: {
      credential_name: true,
      credential_values: true,
      credential_info: true,
    },
  });

  return rows.map((row) => ({
    credentialName: row.credential_name,
    credentialValues: row.credential_values as Record<string, unknown> | null,
    credentialInfo: row.credential_info as Record<string, unknown> | null,
  }));
}

async function readLegacyModels() {
  const rows = await litellmPrisma.liteLLM_ProxyModelTable.findMany({
    select: {
      model_name: true,
      litellm_params: true,
      updated_at: true,
    },
  });

  return rows.map((row) => ({
    modelName: row.model_name,
    litellmParams: row.litellm_params,
    updatedAt: row.updated_at,
  }));
}

function logAction(message: string, dryRun: boolean): void {
  console.log(dryRun ? `[dry-run] ${message}` : message);
}

async function upsertSetting(
  target: ModelProxyPrismaClient,
  key: string,
  value: unknown,
  force: boolean,
  dryRun: boolean,
): Promise<"inserted" | "updated" | "skipped"> {
  const existing = await target.modelProxySetting.findUnique({
    where: { key },
  });

  if (existing && !force) {
    logAction(`skip setting ${key} (already exists)`, dryRun);
    return "skipped";
  }

  if (existing) {
    logAction(`update setting ${key}`, dryRun);
    if (!dryRun) {
      await target.modelProxySetting.update({
        where: { key },
        data: { value: value as never },
      });
    }
    return "updated";
  }

  logAction(`insert setting ${key}`, dryRun);
  if (!dryRun) {
    await target.modelProxySetting.create({
      data: { key, value: value as never },
    });
  }
  return "inserted";
}

async function importCredentialsPhase(
  target: ModelProxyPrismaClient,
  options: ImportLegacyOptions,
  summary: ImportSummary,
): Promise<Set<string>> {
  const counts = createEmptyPhaseCounts();
  const importedNames = new Set<string>();
  const rows = await readLegacyCredentials();

  for (const row of rows) {
    try {
      const mapped = mapLegacyCredential(row, {
        allowLegacyApiKey: options.allowLegacyApiKey,
      });

      for (const key of mapped.unexpectedKeys) {
        summary.warnings.push(
          `Credential "${row.credentialName}" has unmapped credential_values key "${key}"`,
        );
      }

      if (mapped.requiredEnvVar) {
        summary.requiredEnvVars.push(mapped.requiredEnvVar);
      }

      const existing = await target.modelProxyCredential.findUnique({
        where: { name: row.credentialName },
      });

      if (existing && !options.force) {
        logAction(
          `skip credential ${row.credentialName} (already exists)`,
          options.dryRun,
        );
        counts.skipped += 1;
        importedNames.add(row.credentialName);
        continue;
      }

      if (existing) {
        logAction(`update credential ${row.credentialName}`, options.dryRun);
        if (!options.dryRun) {
          await target.modelProxyCredential.update({
            where: { name: row.credentialName },
            data: {
              provider: mapped.data.provider,
              baseUrl: mapped.data.baseUrl,
              secretRef: mapped.data.secretRef,
              ...(options.allowLegacyApiKey
                ? { apiKey: mapped.data.apiKey }
                : {}),
            },
          });
        }
        counts.updated += 1;
      } else {
        logAction(`insert credential ${row.credentialName}`, options.dryRun);
        if (!options.dryRun) {
          await target.modelProxyCredential.create({ data: mapped.data });
        }
        counts.inserted += 1;
      }

      importedNames.add(row.credentialName);
    } catch (error) {
      counts.errors += 1;
      summary.warnings.push(
        `Credential "${row.credentialName}" failed: ${formatError(error)}`,
      );
    }
  }

  mergePhaseCounts(summary, "credentials", counts);
  return importedNames;
}

async function importSettingsPhase(
  target: ModelProxyPrismaClient,
  options: ImportLegacyOptions,
  summary: ImportSummary,
  credentialNames: Set<string>,
): Promise<void> {
  const counts = createEmptyPhaseCounts();
  const source = await readLegacyConfigSource(queryLiteLLMConfig);
  const rows = buildSettingsRows(source);

  for (const row of rows) {
    try {
      const result = await upsertSetting(
        target,
        row.key,
        row.value,
        options.force,
        options.dryRun,
      );
      counts[result] += 1;

      if (
        row.key === "default_credential" &&
        source.defaultCredential &&
        !credentialNames.has(source.defaultCredential)
      ) {
        summary.warnings.push(
          `default_credential "${source.defaultCredential}" is not present in imported credentials`,
        );
      }
    } catch (error) {
      counts.errors += 1;
      summary.warnings.push(
        `Setting "${row.key}" failed: ${formatError(error)}`,
      );
    }
  }

  mergePhaseCounts(summary, "settings", counts);
}

async function importModelsPhase(
  target: ModelProxyPrismaClient,
  options: ImportLegacyOptions,
  summary: ImportSummary,
  credentialNames: Set<string>,
): Promise<void> {
  const counts = createEmptyPhaseCounts();
  const { models, duplicateWarnings } = dedupeLegacyModels(
    await readLegacyModels(),
  );
  summary.warnings.push(...duplicateWarnings);

  for (const row of models) {
    try {
      const mapped = toModelProxyRow(row.modelName, row.litellmParams);

      if (
        mapped.credentialName &&
        !credentialNames.has(mapped.credentialName)
      ) {
        summary.warnings.push(
          `Model "${mapped.modelName}" references missing credential "${mapped.credentialName}"`,
        );
      }

      const existing = await target.modelProxyModel.findUnique({
        where: { modelName: mapped.modelName },
      });

      if (existing && !options.force) {
        logAction(
          `skip model ${mapped.modelName} (already exists)`,
          options.dryRun,
        );
        counts.skipped += 1;
        continue;
      }

      if (existing) {
        logAction(`update model ${mapped.modelName}`, options.dryRun);
        if (!options.dryRun) {
          await target.modelProxyModel.update({
            where: { modelName: mapped.modelName },
            data: {
              enabled: mapped.enabled,
              inputCostPerToken: mapped.inputCostPerToken,
              outputCostPerToken: mapped.outputCostPerToken,
              contextWindowSize: mapped.contextWindowSize,
              maxOutputTokens: mapped.maxOutputTokens,
              credentialName: mapped.credentialName,
              upstreamBaseUrl: mapped.upstreamBaseUrl,
              upstreamModel: mapped.upstreamModel,
              ownedBy: mapped.ownedBy,
              family: mapped.family,
              requestOptions: mapped.requestOptions as never,
            },
          });
        }
        counts.updated += 1;
      } else {
        logAction(`insert model ${mapped.modelName}`, options.dryRun);
        if (!options.dryRun) {
          await target.modelProxyModel.create({ data: mapped });
        }
        counts.inserted += 1;
      }
    } catch (error) {
      counts.errors += 1;
      summary.warnings.push(
        `Model "${row.modelName}" failed: ${formatError(error)}`,
      );
    }
  }

  mergePhaseCounts(summary, "models", counts);
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function loadCredentialNames(
  target: ModelProxyPrismaClient,
): Promise<Set<string>> {
  const rows = await target.modelProxyCredential.findMany({
    select: { name: true },
  });
  return new Set(rows.map((row) => row.name));
}

export async function runLegacyImport(
  options: ImportLegacyOptions,
): Promise<ImportSummary> {
  const summary = createEmptySummary();
  const target = getModelProxyPrisma();
  let jobId: string | null = null;

  try {
    if (!options.dryRun) {
      const job = await target.modelProxyImportJob.create({
        data: {
          source: IMPORT_SOURCE,
          status: "running",
        },
      });
      jobId = job.id;
    } else {
      console.log("[dry-run] skipping model_proxy_import_jobs row creation");
    }

    let credentialNames = new Set<string>();

    if (options.only.has("credentials")) {
      credentialNames = await importCredentialsPhase(target, options, summary);
    } else {
      credentialNames = await loadCredentialNames(target);
    }

    if (options.only.has("settings")) {
      await importSettingsPhase(target, options, summary, credentialNames);
    }

    if (options.only.has("models")) {
      if (!options.only.has("credentials")) {
        credentialNames = await loadCredentialNames(target);
      }
      await importModelsPhase(target, options, summary, credentialNames);
    }

    if (jobId) {
      await target.modelProxyImportJob.update({
        where: { id: jobId },
        data: {
          status: summary.errors > 0 ? "failed" : "completed",
          finishedAt: new Date(),
          summary: summary as never,
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
          summary: summary as never,
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

export function printImportSummary(summary: ImportSummary): void {
  console.log("\nImport summary:");
  console.log(
    `  inserted=${summary.inserted} updated=${summary.updated} skipped=${summary.skipped} errors=${summary.errors}`,
  );

  if (summary.requiredEnvVars.length > 0) {
    console.log("\nRequired env vars:");
    for (const entry of summary.requiredEnvVars) {
      console.log(`  ${entry.secretRef} (credential: ${entry.credential})`);
    }
  }

  if (summary.warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of summary.warnings) {
      console.log(`  - ${warning}`);
    }
  }
}
