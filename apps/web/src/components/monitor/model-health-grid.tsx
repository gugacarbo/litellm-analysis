import type { ModelHealthEntry } from "../../pages/monitor/monitor-types";
import { STATUS_COLORS, STATUS_ORDER } from "../../pages/monitor/monitor-utils";

interface ModelHealthGridProps {
  models: ModelHealthEntry[];
  compact?: boolean;
}

export function ModelHealthGrid({
  models,
  compact = false,
}: ModelHealthGridProps) {
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

  if (compact) {
    return (
      <div>
        <h2 className="mb-3 text-lg font-semibold">Model Health</h2>
        <div className="space-y-2">
          {sorted.map((model) => (
            <CompactModelHealthCard key={model.model} model={model} />
          ))}
        </div>
      </div>
    );
  }

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

function CompactModelHealthCard({ model }: { model: ModelHealthEntry }) {
  const colorClass = STATUS_COLORS[model.status] ?? STATUS_COLORS.unknown;
  const errorRate = model.error_rate_1h.toFixed(1);

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-2 truncate min-w-0">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${colorClass.split(" ")[0]}`}
        />
        <span className="truncate text-sm font-medium">{model.model}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground">
          Error:{" "}
          <span
            className={
              model.error_rate_1h > 10 ? "font-medium text-red-600" : ""
            }
          >
            {errorRate}%
          </span>
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass}`}
        >
          {model.status}
        </span>
      </div>
    </div>
  );
}
