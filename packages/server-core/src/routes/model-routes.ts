import type { Application, Response } from 'express';
import type { RouteOptions } from '../types/index.js';
import { isRecord, applyRequiredLiteLLMParams } from '../orchestration/lite-llm-params.js';

export function registerModelRoutes(
	app: Application,
	opts: RouteOptions,
): void {
	const { dataSource } = opts;

	app.get('/models', async (_req, res) => {
		try {
			const data = await dataSource.getModels();
			res.json(data);
		} catch (error) {
			res.status(500).json({ error: String(error) });
		}
	});

	app.get('/model/details', async (_req, res) => {
		try {
			const data = await dataSource.getModelDetails();
			res.json(data);
		} catch (error) {
			res.status(500).json({ error: String(error) });
		}
	});

	app.post('/models', async (req, res) => {
		try {
			const { modelName, litellmParams } = req.body;
			const normalizedModelName = String(modelName || '').trim();
			if (!normalizedModelName) {
				res.status(400).json({ error: 'modelName is required' });
				return;
			}

			const baseParams = isRecord(litellmParams)
				? litellmParams
				: {};
			await dataSource.createModel({
				modelName: normalizedModelName,
				litellmParams: applyRequiredLiteLLMParams(
					normalizedModelName,
					baseParams,
				),
			});
			res.status(201).json({ success: true });
		} catch (error) {
			res.status(500).json({ error: String(error) });
		}
	});

	app.put('/models/:name', async (req, res) => {
		try {
			const { name } = req.params;
			const { litellmParams, modelName } = req.body;
			const normalizedNewName =
				typeof modelName === 'string' && modelName.trim()
					? modelName.trim()
					: name;

			const updates: {
				litellmParams?: Record<string, unknown>;
				modelName?: string;
			} = {};

			const existingModels = await dataSource.getModels();
			const existingModel = existingModels.find(
				(item) => item.modelName === name,
			);
			const existingParams = isRecord(existingModel?.litellmParams)
				? existingModel.litellmParams
				: {};

			if (litellmParams !== undefined || modelName !== undefined) {
				const incomingParams = isRecord(litellmParams)
					? litellmParams
					: {};
				const mergedParams = {
					...existingParams,
					...incomingParams,
				};
				updates.litellmParams = applyRequiredLiteLLMParams(
					normalizedNewName,
					mergedParams,
				);
			}
			if (modelName !== undefined) updates.modelName = normalizedNewName;
			await dataSource.updateModel(name, updates);
			res.json({ success: true });
		} catch (error) {
			const msg = String(error);
			if (msg.includes('not found') || msg.includes('No row')) {
				res.status(404).json({ error: 'Model not found' });
				return;
			}
			res.status(500).json({ error: msg });
		}
	});

	app.post('/models/merge', async (req, res) => {
		const { sourceModel, targetModel } = req.body;
		if (!sourceModel || !targetModel) {
			res
				.status(400)
				.json({ error: 'sourceModel and targetModel are required' });
			return;
		}
		try {
			await dataSource.mergeModels(sourceModel, targetModel);
			res.json({ success: true });
		} catch (error) {
			res.status(500).json({ error: String(error) });
		}
	});

	const handleDeleteModelLogs = async (
		model: string,
		res: Response,
	) => {
		try {
			await dataSource.deleteModelLogs(model);
			res.json({ success: true });
		} catch (error) {
			res.status(500).json({ error: String(error) });
		}
	};

	app.delete('/models/logs', async (req, res) => {
		const { model } = req.query;
		if (Array.isArray(model)) {
			res
				.status(400)
				.json({ error: 'model must be a single query value' });
			return;
		}
		if (typeof model !== 'string') {
			res
				.status(400)
				.json({ error: 'model query parameter is required' });
			return;
		}
		await handleDeleteModelLogs(model, res);
	});

	app.delete('/models/logs/:model', async (req, res) => {
		await handleDeleteModelLogs(req.params.model, res);
	});

	app.delete('/models/:name', async (req, res) => {
		try {
			const { name } = req.params;
			await dataSource.deleteModel(name);
			res.json({ success: true });
		} catch (error) {
			res.status(500).json({ error: String(error) });
		}
	});
}
