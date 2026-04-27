import type { Application } from 'express';
import type { RouteOptions } from '../types/index.js';

export function registerModeRoutes(
	app: Application,
	opts: RouteOptions,
): void {
	const { dataSource } = opts;

	app.get('/mode', (_req, res) => {
		const { capabilities } = dataSource;
		let mode: string;
		if (capabilities.errorLogs && capabilities.createModel) {
			mode = 'database';
		} else if (capabilities.errorLogs && !capabilities.createModel) {
			mode = 'limited';
		} else {
			mode = 'api-only';
		}
		res.json({
			mode,
			capabilities,
		});
	});
}
