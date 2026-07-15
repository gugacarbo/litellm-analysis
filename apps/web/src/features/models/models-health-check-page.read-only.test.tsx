import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/health-check/components/health-status-content", () => ({
  HealthStatusContent: ({ readOnly }: { readOnly?: boolean }) => (
    <div>{readOnly ? "read-only health results" : "writer controls"}</div>
  ),
}));

import { ModelsHealthCheckPage } from "./models-health-check-page";

describe("ModelsHealthCheckPage", () => {
  it("mounts health results in read-only mode", () => {
    render(<ModelsHealthCheckPage />);

    expect(screen.getByText("read-only health results")).toBeInTheDocument();
    expect(screen.queryByText("writer controls")).toBeNull();
  });
});
