import type { Application } from "express";

const LEGACY_MUTATION_PREFIXES = [
  "/models",
  "/agent-catalog",
  "/category-catalog",
  "/plugin-routing",
];

type ExpressLayer = {
  route?: { path?: string; methods?: Record<string, boolean> };
};

/** Removes deprecated configuration writers while retaining their GET routes. */
export function unregisterLegacyMutationRoutes(app: Application): void {
  // Express 4 stores registered layers on _router. Do not read app.router:
  // Express 4 exposes it as a deprecated getter that throws in this runtime.
  const express4 = app as unknown as { _router?: { stack?: ExpressLayer[] } };
  const stack = express4._router?.stack;
  if (!stack) return;

  const router = express4._router;
  if (!router) return;
  router.stack = stack.filter((layer) => {
    const route = layer.route;
    const path = route?.path;
    if (
      !path ||
      !LEGACY_MUTATION_PREFIXES.some((prefix) => path.startsWith(prefix))
    ) {
      return true;
    }
    return !Object.entries(route.methods ?? {}).some(
      ([method, enabled]) =>
        enabled && !["get", "head", "options"].includes(method),
    );
  });
}
