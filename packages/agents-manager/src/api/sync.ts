import * as fs from 'node:fs';
import type { AgentConfigFile } from '../types/index.js';
import { getAgentTransformer, getCategoryTransformer, getLegacyConfigFile } from './singleton.js';
import { readDb } from './crud.js';

// ── Legacy config file output (oh-my-openagent.json) ──

async function writeOutputConfigFile(
  config: AgentConfigFile,
  legacyConfigFile: string,
): Promise<void> {
  const tmpPath = `${legacyConfigFile}.tmp`;
  await fs.promises.writeFile(
    tmpPath,
    JSON.stringify(config, null, 2),
    'utf-8',
  );
  await fs.promises.rename(tmpPath, legacyConfigFile);
}

export async function syncOutputConfigFile(): Promise<void> {
  const db = await readDb();
  const agentTransformer = getAgentTransformer();
  const categoryTransformer = getCategoryTransformer();
  const legacyConfigFile = getLegacyConfigFile();

  const legacy = {
    $schema: 'https://raw.githubusercontent.com/opensoft/oh-my-opencode/dev/assets/oh-my-opencode.schema.json',
    ...(db.globalFallbackModel ? { globalFallbackModel: db.globalFallbackModel } : {}),
    git_master: {
      commit_footer: false,
      include_co_authored_by: false,
    },
    agents: agentTransformer.toOutput(db.agents, db.globalFallbackModel),
    categories: categoryTransformer.toOutput(db.categories, db.globalFallbackModel),
  };

  await writeOutputConfigFile(legacy, legacyConfigFile);
}
