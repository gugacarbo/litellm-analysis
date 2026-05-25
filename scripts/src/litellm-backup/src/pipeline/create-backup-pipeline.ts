import { Listr } from "listr2";
import { cleanOldBackupsTask } from "../tasks/clean-old-backups-task";
import { finalizeBackupTask } from "../tasks/finalize-backup-task";
import { listRecentBackupsTask } from "../tasks/list-recent-backups-task";
import { prepareBackupConfigTask } from "../tasks/prepare-backup-config-task";
import { runPgDumpTask } from "../tasks/run-pg-dump-task";
import { validateEnvironmentTask } from "../tasks/validate-environment-task";
import type { BackupConfig, BackupContext } from "../types/backup";

export function createBackupPipeline(
  initialConfig: BackupConfig,
): Listr<BackupContext> {
  return new Listr<BackupContext>(
    [
      {
        title: "Preparar configuração do backup",
        task: prepareBackupConfigTask,
      },
      {
        title: "Validar ambiente e preparar diretório",
        task: validateEnvironmentTask,
      },
      { title: "Executar pg_dump via Docker", task: runPgDumpTask },
      { title: "Remover backups antigos", task: cleanOldBackupsTask },
      { title: "Listar backups recentes", task: listRecentBackupsTask },
      { title: "Finalizar backup", task: finalizeBackupTask },
    ],
    {
      ctx: { config: initialConfig },
      exitOnError: true,
      concurrent: false,
    },
  );
}
