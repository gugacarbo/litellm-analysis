import * as fs from 'node:fs';
import * as path from 'node:path';

const CONFIG_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'agent-config.json');

export interface AgentConfig {
	model?: string;
	fallback_models?: string[];
	variant?: string;
	category?: string;
	skills?: string[];
	temperature?: number;
	top_p?: number;
	prompt?: string;
	prompt_append?: string;
	tools?: Record<string, boolean>;
	disable?: boolean;
	description?: string;
	mode?: 'subagent' | 'primary' | 'all';
	color?: string;
	permission?: {
		edit?: 'ask' | 'allow' | 'deny';
		bash?: 'ask' | 'allow' | 'deny' | Record<string, 'ask' | 'allow' | 'deny'>;
		webfetch?: 'ask' | 'allow' | 'deny';
		doom_loop?: 'ask' | 'allow' | 'deny';
		external_directory?: 'ask' | 'allow' | 'deny';
	};
}

export interface CategoryConfig {
	model?: string;
	fallback_models?: string[];
	variant?: string;
	temperature?: number;
	top_p?: number;
	maxTokens?: number;
	thinking?: {
		type: 'enabled' | 'disabled';
		budgetTokens?: number;
	};
	reasoningEffort?: 'low' | 'medium' | 'high' | 'xhigh';
	textVerbosity?: 'low' | 'medium' | 'high';
	tools?: Record<string, boolean>;
	prompt_append?: string;
	is_unstable_agent?: boolean;
	description?: string;
}

export interface AgentConfigFile {
	agents: Record<string, AgentConfig>;
	categories: Record<string, CategoryConfig>;
}

async function ensureDir(): Promise<void> {
	await fs.promises.mkdir(CONFIG_DIR, { recursive: true });
}

export async function readConfigFile(): Promise<AgentConfigFile> {
	try {
		const content = await fs.promises.readFile(CONFIG_FILE, 'utf-8');
		const parsed = JSON.parse(content) as AgentConfigFile;
		return {
			agents: parsed.agents || {},
			categories: parsed.categories || {},
		};
	} catch (error: unknown) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return { agents: {}, categories: {} };
		}
		throw new Error(`Failed to read config file: ${(error as Error).message}`);
	}
}

function isEmptyValue(value: unknown): boolean {
	if (value === '' || value === null || value === undefined) return true;
	if (Array.isArray(value) && value.length === 0) return true;
	if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) return true;
	return false;
}

function stripEmptyValues<T extends Record<string, unknown>>(obj: T): Partial<T> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		if (isEmptyValue(value)) continue;
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			const stripped = stripEmptyValues(value as Record<string, unknown>);
			if (Object.keys(stripped).length > 0) {
				result[key] = stripped;
			}
		} else {
			result[key] = value;
		}
	}
	return result as Partial<T>;
}

function sanitizeConfig(config: AgentConfigFile): AgentConfigFile {
	const agents: Record<string, AgentConfig> = {};
	for (const [key, agent] of Object.entries(config.agents || {})) {
		if (Object.keys(agent).length === 0) continue;
		agents[key] = stripEmptyValues(agent as Record<string, unknown>) as AgentConfig;
	}
	const categories: Record<string, CategoryConfig> = {};
	for (const [key, category] of Object.entries(config.categories || {})) {
		if (Object.keys(category).length === 0) continue;
		categories[key] = stripEmptyValues(category as Record<string, unknown>) as CategoryConfig;
	}
	return { agents, categories };
}

async function writeConfigFile(config: AgentConfigFile): Promise<void> {
	const sanitized = sanitizeConfig(config);
	await ensureDir();
	const tmpPath = `${CONFIG_FILE}.tmp`;
	await fs.promises.writeFile(tmpPath, JSON.stringify(sanitized, null, 2), "utf-8");
	await fs.promises.rename(tmpPath, CONFIG_FILE);
}

export async function updateAgentInConfig(
	agentKey: string,
	config: Partial<AgentConfig>,
): Promise<void> {
	const fullConfig = await readConfigFile();
	fullConfig.agents = fullConfig.agents || {};
	fullConfig.agents[agentKey] = { ...fullConfig.agents[agentKey], ...config };
	await writeConfigFile(fullConfig);
}

export async function updateCategoryInConfig(
	categoryKey: string,
	config: Partial<CategoryConfig>,
): Promise<void> {
	const fullConfig = await readConfigFile();
	fullConfig.categories = fullConfig.categories || {};
	fullConfig.categories[categoryKey] = { ...fullConfig.categories[categoryKey], ...config };
	await writeConfigFile(fullConfig);
}

export async function writeFullConfig(config: AgentConfigFile): Promise<void> {
	await writeConfigFile({
		agents: config.agents || {},
		categories: config.categories || {},
	});
}

export async function deleteAgentFromConfig(agentKey: string): Promise<void> {
	const fullConfig = await readConfigFile();
	if (fullConfig.agents && agentKey in fullConfig.agents) {
		delete fullConfig.agents[agentKey];
		await writeConfigFile(fullConfig);
	}
}

export async function deleteCategoryFromConfig(categoryKey: string): Promise<void> {
	const fullConfig = await readConfigFile();
	if (fullConfig.categories && categoryKey in fullConfig.categories) {
		delete fullConfig.categories[categoryKey];
		await writeConfigFile(fullConfig);
	}
}
