import * as fs from 'node:fs';
import { buildVscodeModelsArray } from './model-builder.js';
import { mergeModelsFromDb, type DbModelWithParams } from './merger.js';

// ── VSCode Models Generator: Generate vscode-oaicopilot.json ──

export interface IVscodeModelsGenerator {
  write(dbModels?: DbModelWithParams[]): Promise<void>;
}

export class VscodeModelsGenerator implements IVscodeModelsGenerator {
  private readonly vscodeModelsFile: string;

  constructor(vscodeModelsFile: string) {
    this.vscodeModelsFile = vscodeModelsFile;
  }

  async write(dbModels?: DbModelWithParams[]): Promise<void> {
    const readDb = (await import('../../index.js')).readDb;
    const db = await readDb();

    const mergedModels = mergeModelsFromDb(db.models, dbModels);
    const baseUrl = db.litellm.baseUrl.replace(/\/v1$/, '');
    const vscodeModels = buildVscodeModelsArray(mergedModels, baseUrl);

    const output: Record<string, unknown> = {
      'oaicopilot.commitLanguage': 'Portuguese (Brazil)',
      'oaicopilot.baseUrl': '',
      'oaicopilot.delay': 0,
      'oaicopilot.readFileLines': 0,
      'oaicopilot.retry': {
        enabled: true,
        max_attempts: 3,
        interval_ms: 2000,
        status_codes: [],
      },
      'oaicopilot.models': vscodeModels,
    };

    await fs.promises.writeFile(
      this.vscodeModelsFile,
      JSON.stringify(output, null, 2),
      'utf-8',
    );
  }
}

// ── Factory ──

export function createVscodeModelsGenerator(vscodeModelsFile: string): VscodeModelsGenerator {
  return new VscodeModelsGenerator(vscodeModelsFile);
}
