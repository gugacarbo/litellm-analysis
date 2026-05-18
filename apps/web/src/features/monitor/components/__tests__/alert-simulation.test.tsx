import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  ModelHealthEntry,
  MonitorAlert,
} from "@/pages/monitor/monitor-types";
import { AlertHistoryTable } from "../alert-history-table";

function createMockAlert(overrides: Partial<MonitorAlert> = {}): MonitorAlert {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: now + Math.random(),
    anomalyType: "error_spike",
    model: "gpt-4",
    severity: "critical",
    message: "Simulated alert for testing",
    metadata: null,
    detectedAt: now,
    acknowledgedAt: null,
    createdAt: now,
    ...overrides,
  };
}

function createMockModelEntry(modelName: string): ModelHealthEntry {
  return {
    model: modelName,
    status: "healthy",
    last_error_at: null,
    error_rate_1h: 0,
    stats: {
      total_requests: 100,
      success_count: 98,
      error_count: 2,
      avg_latency_ms: 150,
      p95_latency_ms: 300,
      last_success_at: null,
      last_error_at: null,
    },
  };
}

function createErrorSpikeAlert(model = "gpt-4"): MonitorAlert {
  return createMockAlert({
    anomalyType: "error_spike",
    model,
    severity: "critical",
    message: `Error spike detected for model "${model}". Current rate: 45.0 errors/hour, baseline: 10.0 errors/hour (4.5x increase)`,
  });
}

function createModelOfflineAlert(model = "claude-3"): MonitorAlert {
  return createMockAlert({
    anomalyType: "model_offline",
    model,
    severity: "critical",
    message: `Model "${model}" appears to be offline. Recent failures: Connection timeout; Rate limit exceeded`,
  });
}

function createTimeoutStuckAlert(model = "gpt-3.5-turbo"): MonitorAlert {
  return createMockAlert({
    anomalyType: "timeout_stuck",
    model,
    severity: "warning",
    message: `Detected ${model} requests stuck for over 5 minutes`,
  });
}

function createSilentFailureAlert(model = "gemini-pro"): MonitorAlert {
  return createMockAlert({
    anomalyType: "silent_failure",
    model,
    severity: "warning",
    message: `Model "${model}" has success rate below 80% without visible errors`,
  });
}

class MockWsClient {
  private messageCallbacks: Set<
    (msg: { type: string; data: unknown }) => void
  > = new Set();
  private statusCallbacks: Set<(status: string) => void> = new Set();
  private _status: string = "disconnected";

  onMessage(
    callback: (msg: { type: string; data: unknown }) => void,
  ): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onStatusChange(callback: (status: string) => void): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  getStatus(): string {
    return this._status;
  }

  connect(): void {
    this._status = "connecting";
    this.statusCallbacks.forEach((cb) => {
      cb(this._status);
    });
    setTimeout(() => {
      this._status = "connected";
      this.statusCallbacks.forEach((cb) => {
        cb(this._status);
      });
    }, 0);
  }

  disconnect(): void {
    this._status = "disconnected";
    this.statusCallbacks.forEach((cb) => {
      cb(this._status);
    });
  }

  destroy(): void {
    this.messageCallbacks.clear();
    this.statusCallbacks.clear();
  }

  simulateAlert(alert: MonitorAlert): void {
    this.messageCallbacks.forEach((cb) => {
      cb({ type: "alert", data: alert });
    });
  }

  simulateAlerts(alerts: MonitorAlert[]): void {
    alerts.forEach((alert) => {
      this.simulateAlert(alert);
    });
  }
}

// Use vi.hoisted so the constant is available when vi.mock runs
const SAMPLE_ALERTS = vi.hoisted(
  () =>
    [
      {
        id: 1,
        anomalyType: "error_spike",
        model: "gpt-4",
        severity: "critical",
        message:
          "Error spike detected for gpt-4. Current rate: 45.0 errors/hour",
        metadata: null,
        detectedAt: Math.floor(Date.now() / 1000) - 300,
        acknowledgedAt: null,
        createdAt: Math.floor(Date.now() / 1000) - 300,
      },
      {
        id: 2,
        anomalyType: "model_offline",
        model: "claude-3-opus",
        severity: "critical",
        message: 'Model "claude-3-opus" appears to be offline',
        metadata: null,
        detectedAt: Math.floor(Date.now() / 1000) - 600,
        acknowledgedAt: null,
        createdAt: Math.floor(Date.now() / 1000) - 600,
      },
      {
        id: 3,
        anomalyType: "timeout_stuck",
        model: "gpt-3.5-turbo",
        severity: "warning",
        message: "Detected requests stuck for over 5 minutes",
        metadata: null,
        detectedAt: Math.floor(Date.now() / 1000) - 900,
        acknowledgedAt: Math.floor(Date.now() / 1000) - 600,
        createdAt: Math.floor(Date.now() / 1000) - 900,
      },
    ] as MonitorAlert[],
);

// Mocks must be at the top level
vi.mock("@/lib/api-client/monitor", () => ({
  getMonitorAlerts: vi.fn().mockResolvedValue({
    alerts: SAMPLE_ALERTS,
    total: SAMPLE_ALERTS.length,
  }),
  acknowledgeAlertById: vi.fn().mockResolvedValue(undefined),
}));

describe("Alert Simulation Utilities", () => {
  describe("createMockAlert", () => {
    it("creates an alert with default values", () => {
      const alert = createMockAlert();
      expect(alert.anomalyType).toBe("error_spike");
      expect(alert.model).toBe("gpt-4");
      expect(alert.severity).toBe("critical");
      expect(alert.acknowledgedAt).toBeNull();
      expect(alert.detectedAt).toBeDefined();
    });

    it("overrides default values with provided ones", () => {
      const alert = createMockAlert({
        anomalyType: "model_offline",
        severity: "warning",
        model: "custom-model",
      });
      expect(alert.anomalyType).toBe("model_offline");
      expect(alert.severity).toBe("warning");
      expect(alert.model).toBe("custom-model");
    });
  });

  describe("createErrorSpikeAlert", () => {
    it("creates an error spike alert with correct type", () => {
      const alert = createErrorSpikeAlert("custom-model");
      expect(alert.anomalyType).toBe("error_spike");
      expect(alert.model).toBe("custom-model");
      expect(alert.severity).toBe("critical");
      expect(alert.message).toContain("custom-model");
    });
  });

  describe("createModelOfflineAlert", () => {
    it("creates a model offline alert with correct type", () => {
      const alert = createModelOfflineAlert();
      expect(alert.anomalyType).toBe("model_offline");
      expect(alert.severity).toBe("critical");
    });
  });

  describe("MockWsClient", () => {
    it("simulates alert reception", () => {
      const client = new MockWsClient();
      const receivedAlerts: MonitorAlert[] = [];

      client.onMessage((msg) => {
        if (msg.type === "alert") {
          receivedAlerts.push(msg.data as MonitorAlert);
        }
      });

      client.connect();
      const alert = createErrorSpikeAlert();
      client.simulateAlert(alert);

      expect(receivedAlerts).toHaveLength(1);
      expect(receivedAlerts[0].anomalyType).toBe("error_spike");
      client.destroy();
    });

    it("simulates multiple alerts", () => {
      const client = new MockWsClient();
      const receivedAlerts: MonitorAlert[] = [];

      client.onMessage((msg) => {
        if (msg.type === "alert") {
          receivedAlerts.push(msg.data as MonitorAlert);
        }
      });

      client.connect();
      const alerts = [
        createErrorSpikeAlert(),
        createModelOfflineAlert(),
        createTimeoutStuckAlert(),
      ];
      client.simulateAlerts(alerts);

      expect(receivedAlerts).toHaveLength(3);
      client.destroy();
    });

    it("tracks connection status", () => {
      const client = new MockWsClient();
      const statuses: string[] = [];

      client.onStatusChange((status) => statuses.push(status));
      client.connect();

      expect(statuses).toContain("connecting");
      client.destroy();
    });
  });
});

describe("AlertHistoryTable with simulated alerts", () => {
  it("displays alert history card", async () => {
    render(
      <AlertHistoryTable
        lastAlerts={[]}
        models={[createMockModelEntry("gpt-4")]}
        onAcknowledge={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Alert History")).toBeInTheDocument();
    });

    // Check total count is shown
    expect(screen.getByText("3 matching alerts")).toBeInTheDocument();
  });

  it("displays alert type badges", async () => {
    render(
      <AlertHistoryTable
        lastAlerts={[]}
        models={[createMockModelEntry("gpt-4")]}
        onAcknowledge={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Error Spike")).toBeInTheDocument();
    });

    expect(screen.getByText("Model Offline")).toBeInTheDocument();
    // Note: timeout_stuck renders as "Timeout/Stuck" (see alert-type-badge.tsx)
    expect(screen.getByText("Timeout/Stuck")).toBeInTheDocument();
  });

  it("displays severity badges", async () => {
    render(
      <AlertHistoryTable
        lastAlerts={[]}
        models={[createMockModelEntry("gpt-4")]}
        onAcknowledge={vi.fn()}
      />,
    );

    await waitFor(() => {
      // First alert is critical
      expect(screen.getAllByText("critical").length).toBeGreaterThan(0);
    });
  });

  it("shows acknowledge buttons for unacknowledged alerts", async () => {
    render(
      <AlertHistoryTable
        lastAlerts={[]}
        models={[createMockModelEntry("gpt-4")]}
        onAcknowledge={vi.fn()}
      />,
    );

    await waitFor(() => {
      // Should have at least one acknowledge button
      const buttons = screen.getAllByRole("button", { name: /acknowledge/i });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});

describe("Alert lifecycle simulation", () => {
  it("simulates the full alert lifecycle", async () => {
    const mockAlerts = [
      createErrorSpikeAlert("gpt-4"),
      createModelOfflineAlert("claude-3"),
    ];

    const client = new MockWsClient();
    client.connect();

    const receivedAlerts: MonitorAlert[] = [];
    client.onMessage((msg) => {
      if (msg.type === "alert") {
        receivedAlerts.push(msg.data as MonitorAlert);
      }
    });

    client.simulateAlerts(mockAlerts);

    expect(receivedAlerts).toHaveLength(2);
    expect(receivedAlerts[0].anomalyType).toBe("error_spike");
    expect(receivedAlerts[1].anomalyType).toBe("model_offline");

    const firstAlert = receivedAlerts[0];
    const acknowledgedAlert = {
      ...firstAlert,
      acknowledgedAt: Math.floor(Date.now() / 1000),
    };
    expect(acknowledgedAlert.acknowledgedAt).not.toBeNull();

    client.destroy();
  });
});

describe("Different alert types", () => {
  const alertCreators = [
    { name: "error_spike", creator: createErrorSpikeAlert },
    { name: "model_offline", creator: createModelOfflineAlert },
    { name: "timeout_stuck", creator: createTimeoutStuckAlert },
    { name: "silent_failure", creator: createSilentFailureAlert },
  ];

  alertCreators.forEach(({ name, creator }) => {
    it(`creates ${name} alert with correct properties`, () => {
      const alert = creator();
      expect(alert.anomalyType).toBe(name);
      expect(alert.detectedAt).toBeDefined();
      expect(alert.id).toBeDefined();
      expect(alert.message).toBeDefined();
    });
  });
});
