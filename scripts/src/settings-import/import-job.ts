import type { Prisma, PrismaClient } from "@lite-llm/model-proxy-repository";
import type { ImportSummary } from "./types.js";

export async function runImportJob(
  prisma: PrismaClient,
  source: string,
  run: () => Promise<ImportSummary>,
): Promise<ImportSummary> {
  const job = await prisma.modelProxyImportJob.create({
    data: {
      source,
      status: "running",
    },
  });

  try {
    const summary = await run();

    await prisma.modelProxyImportJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        finishedAt: new Date(),
        summary: summary as unknown as Prisma.InputJsonValue,
      },
    });

    return summary;
  } catch (error) {
    await prisma.modelProxyImportJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
