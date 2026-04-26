import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SpendLog } from "../../types/analytics";
import { LogsTable } from "./logs-table";
import type { LogColumnKey } from "./logs-table-columns";

const SAMPLE_LOGS: SpendLog[] = [
  {
    request_id: "req-1",
    model: "gpt-4.1-mini",
    user: "alice",
    total_tokens: 150,
    prompt_tokens: 100,
    completion_tokens: 50,
    spend: 0.0015,
    time_to_first_token_ms: 420,
    start_time: "2026-04-24T10:00:00.000Z",
    end_time: "2026-04-24T10:00:01.000Z",
    api_key: "key-1",
    status: "200",
  },
  {
    request_id: "req-2",
    model: "gpt-4.1-mini",
    user: "alice",
    total_tokens: 90,
    prompt_tokens: 60,
    completion_tokens: 30,
    spend: 0.0009,
    time_to_first_token_ms: 180,
    start_time: "2026-04-24T10:01:00.000Z",
    end_time: "2026-04-24T10:01:01.000Z",
    api_key: "key-1",
    status: "200",
  },
];

const VISIBLE_COLUMNS: LogColumnKey[] = ["model", "spend", "status"];

describe("LogsTable", () => {
  it("keeps grouped rows aligned when some columns are hidden", async () => {
    const onSelectLog = vi.fn();
    const { container } = render(
      <LogsTable
        logs={SAMPLE_LOGS}
        loading={false}
        refreshing={false}
        page={1}
        pageSize={20}
        pagination={{
          total: SAMPLE_LOGS.length,
          page: 1,
          page_size: 20,
          total_pages: 1,
        }}
        visibleColumns={VISIBLE_COLUMNS}
        autoRefetchEnabled={false}
        groupByModel={true}
        onSelectLog={onSelectLog}
        onToggleColumn={vi.fn()}
        onAutoRefetchChange={vi.fn()}
        onGroupByModelChange={vi.fn()}
        onRefetch={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    const headerCellCount = container.querySelectorAll("thead tr th").length;
    expect(headerCellCount).toBe(VISIBLE_COLUMNS.length + 1);
    expect(screen.getByText("$0.0024")).toBeInTheDocument();

    const bodyRows = container.querySelectorAll("tbody tr");
    expect(bodyRows[0]?.querySelectorAll("td").length).toBe(headerCellCount);

    await userEvent.click(bodyRows[0] as HTMLTableRowElement);

    await waitFor(() => {
      const expandedRows = container.querySelectorAll("tbody tr");
      expect(expandedRows).toHaveLength(3);
    });

    const firstExpandedRow = container.querySelectorAll("tbody tr")[1];
    expect(firstExpandedRow?.querySelectorAll("td").length).toBe(
      headerCellCount,
    );
  });

  it("shows average tokens/s for grouped rows", () => {
    const { container } = render(
      <LogsTable
        logs={[
          {
            request_id: "tps-1",
            model: "gpt-4.1-mini",
            user: "alice",
            total_tokens: 30,
            prompt_tokens: 20,
            completion_tokens: 10,
            spend: 0.001,
            time_to_first_token_ms: null,
            start_time: "2026-04-24T10:00:00.000Z",
            end_time: "2026-04-24T10:00:02.000Z",
            api_key: "key-1",
            status: "200",
          },
          {
            request_id: "tps-2",
            model: "gpt-4.1-mini",
            user: "alice",
            total_tokens: 40,
            prompt_tokens: 10,
            completion_tokens: 30,
            spend: 0.0012,
            time_to_first_token_ms: null,
            start_time: "2026-04-24T10:01:00.000Z",
            end_time: "2026-04-24T10:01:03.000Z",
            api_key: "key-1",
            status: "200",
          },
        ]}
        loading={false}
        refreshing={false}
        page={1}
        pageSize={20}
        pagination={{
          total: 2,
          page: 1,
          page_size: 20,
          total_pages: 1,
        }}
        visibleColumns={["model", "tokensPerSecond"]}
        autoRefetchEnabled={false}
        groupByModel={true}
        onSelectLog={vi.fn()}
        onToggleColumn={vi.fn()}
        onAutoRefetchChange={vi.fn()}
        onGroupByModelChange={vi.fn()}
        onRefetch={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    const headerCellCount = container.querySelectorAll("thead tr th").length;
    expect(headerCellCount).toBe(3);
    expect(screen.getByText("7.5/s")).toBeInTheDocument();
  });

  it("shows average ttft for grouped rows", () => {
    render(
      <LogsTable
        logs={[
          {
            request_id: "ttft-1",
            model: "gpt-4.1-mini",
            user: "alice",
            total_tokens: 30,
            prompt_tokens: 20,
            completion_tokens: 10,
            spend: 0.001,
            time_to_first_token_ms: 250,
            start_time: "2026-04-24T10:00:00.000Z",
            end_time: "2026-04-24T10:00:02.000Z",
            api_key: "key-1",
            status: "200",
          },
          {
            request_id: "ttft-2",
            model: "gpt-4.1-mini",
            user: "alice",
            total_tokens: 40,
            prompt_tokens: 10,
            completion_tokens: 30,
            spend: 0.0012,
            time_to_first_token_ms: 350,
            start_time: "2026-04-24T10:01:00.000Z",
            end_time: "2026-04-24T10:01:03.000Z",
            api_key: "key-1",
            status: "200",
          },
        ]}
        loading={false}
        refreshing={false}
        page={1}
        pageSize={20}
        pagination={{
          total: 2,
          page: 1,
          page_size: 20,
          total_pages: 1,
        }}
        visibleColumns={["model", "timeToFirstToken"]}
        autoRefetchEnabled={false}
        groupByModel={true}
        onSelectLog={vi.fn()}
        onToggleColumn={vi.fn()}
        onAutoRefetchChange={vi.fn()}
        onGroupByModelChange={vi.fn()}
        onRefetch={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByText("300")).toBeInTheDocument();
  });

  it("shows partial status badge on grouped rows when any request fails", () => {
    render(
      <LogsTable
        logs={[
          {
            request_id: "status-1",
            model: "gpt-4.1-mini",
            user: "alice",
            total_tokens: 30,
            prompt_tokens: 20,
            completion_tokens: 10,
            spend: 0.001,
            time_to_first_token_ms: 200,
            start_time: "2026-04-24T10:00:00.000Z",
            end_time: "2026-04-24T10:00:02.000Z",
            api_key: "key-1",
            status: "200",
          },
          {
            request_id: "status-2",
            model: "gpt-4.1-mini",
            user: "alice",
            total_tokens: 40,
            prompt_tokens: 10,
            completion_tokens: 30,
            spend: 0.0012,
            time_to_first_token_ms: 300,
            start_time: "2026-04-24T10:01:00.000Z",
            end_time: "2026-04-24T10:01:03.000Z",
            api_key: "key-1",
            status: "500",
          },
        ]}
        loading={false}
        refreshing={false}
        page={1}
        pageSize={20}
        pagination={{
          total: 2,
          page: 1,
          page_size: 20,
          total_pages: 1,
        }}
        visibleColumns={["model", "status"]}
        autoRefetchEnabled={false}
        groupByModel={true}
        onSelectLog={vi.fn()}
        onToggleColumn={vi.fn()}
        onAutoRefetchChange={vi.fn()}
        onGroupByModelChange={vi.fn()}
        onRefetch={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByText("partial")).toBeInTheDocument();
  });
});
