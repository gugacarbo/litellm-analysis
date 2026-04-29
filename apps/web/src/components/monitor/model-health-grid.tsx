import type { ModelHealthEntry } from "../../pages/monitor/monitor-types";

const STATUS_ORDER: Record<string, number> = {
  offline: 0,
  degraded: 1,
  healthy: 2,
  unknown: 3,
};
const STATUS_COLORS: Record<string, string> = {
  offline: "bg-red-500/15 text-red-700 border-red-500/30",
  degraded: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  healthy: "bg-green-500/15 text-green-700 border-green-500/30",
  unknown: "bg-gray-500/15 text-gray-700 border-gray-500/30",
};

interface ModelHealthGridProps {
  models: ModelHealthEntry[];
}

export function ModelHealthGrid({ models }: ModelHealthGridProps) {
  if (models.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold">Model Health</h2>
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>Waiting for data...</p>
          <p className="mt-1 text-sm">
            Anomaly detection will populate model health as data arrives.
          </p>
        </div>
      </div>
    );
  }

  const sorted = [...models].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3),
  );

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Model Health</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((model) => (
          <ModelHealthCard key={model.model} model={model} />
        ))}
      </div>
    </div>
  );
}

function ModelHealthCard({ model }: { model: ModelHealthEntry }) {
  const colorClass = STATUS_COLORS[model.status] ?? STATUS_COLORS.unknown;
  const errorRate = model.error_rate_1h.toFixed(1);

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="truncate font-medium">{model.model}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass}`}
        >
          {model.status}
        </span>
      </div>
      <div className="text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>Error rate (1h)</span>
          <span
            className={
              model.error_rate_1h > 10 ? "font-medium text-red-600" : ""
            }
          >
            {errorRate}%
          </span>
        </div>
        {model.last_error_at && (
          <div className="mt-1 flex justify-between">
            <span>Last error</span>
            <span className="tabular-nums">
              {new Date(model.last_error_at).toLocaleString()}
            </span>
          </div>
        )}
        {!model.last_error_at && model.status === "healthy" && (
          <div className="mt-1 text-green-600">No recent errors</div>
        )}
      </div>
    </div>
  );
}
