import { useMemo, useState } from 'react';
import type { PaginationMetadata, SpendLog } from '../../types/analytics';
import { Card, CardContent } from '../card';
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from '../table';
import { LogsTableBody } from './logs-table-body';
import { LogsTableHeader } from './logs-table-header';
import {
  LOG_COLUMNS,
  type LogColumnKey,
  type TableColumn,
} from './logs-table-columns';
import { groupLogsByModel } from './logs-table-utils';
import { LogsPaginationControls } from './logs-pagination-controls';

export { DEFAULT_VISIBLE_LOG_COLUMNS } from './logs-table-columns';

type LogsTableProps = {
  logs: SpendLog[];
  loading: boolean;
  refreshing: boolean;
  page: number;
  pageSize: number;
  pagination: PaginationMetadata;
  visibleColumns: LogColumnKey[];
  autoRefetchEnabled: boolean;
  groupByModel: boolean;
  onSelectLog: (log: SpendLog) => void;
  onToggleColumn: (column: LogColumnKey) => void;
  onAutoRefetchChange: (enabled: boolean) => void;
  onGroupByModelChange: (enabled: boolean) => void;
  onRefetch: () => void;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: string) => void;
};

export function LogsTable({
  logs,
  loading,
  refreshing,
  page,
  pageSize,
  pagination,
  visibleColumns,
  autoRefetchEnabled,
  groupByModel,
  onSelectLog,
  onToggleColumn,
  onAutoRefetchChange,
  onGroupByModelChange,
  onRefetch,
  onPageChange,
  onPageSizeChange,
}: LogsTableProps) {
  const isFetching = loading || refreshing;
  const showGroupExpanderColumn = groupByModel;

  const tableColumns: TableColumn[] = LOG_COLUMNS.filter((column) =>
    visibleColumns.includes(column.key),
  );

  const [expandedGroups, setExpandedGroups] = useState<
    Record<string, boolean>
  >({});

  const groupedLogs = useMemo(() => {
    if (!groupByModel || logs.length === 0) return null;

    const groups = groupLogsByModel(logs);

    const initialExpanded: Record<string, boolean> = {};
    for (const group of groups) {
      const key = `${group.model}-${group.logs[0].request_id}`;
      if (expandedGroups[key] === undefined) {
        initialExpanded[key] = false;
      }
    }
    if (Object.keys(initialExpanded).length > 0) {
      setExpandedGroups((prev) => ({ ...prev, ...initialExpanded }));
    }

    return groups;
  }, [groupByModel, logs, expandedGroups]);

  const handleToggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  return (
    <Card>
      <LogsTableHeader
        loading={loading}
        paginationTotal={pagination.total}
        groupByModel={groupByModel}
        autoRefetchEnabled={autoRefetchEnabled}
        isFetching={isFetching}
        visibleColumns={visibleColumns}
        onGroupByModelChange={onGroupByModelChange}
        onAutoRefetchChange={onAutoRefetchChange}
        onRefetch={onRefetch}
        onToggleColumn={onToggleColumn}
      />
      <CardContent className='space-y-4'>
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                {showGroupExpanderColumn ? (
                  <TableHead className='w-10' aria-label='Expand group' />
                ) : null}
                {tableColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={
                      column.align === 'right' ? 'text-right' : ''
                    }
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <LogsTableBody
              loading={loading}
              logs={logs}
              groupedLogs={groupedLogs}
              expandedGroups={expandedGroups}
              tableColumns={tableColumns}
              showGroupExpanderColumn={showGroupExpanderColumn}
              onToggleGroup={handleToggleGroup}
              onSelectLog={onSelectLog}
            />
          </Table>
        </div>

        <LogsPaginationControls
          page={page}
          pageSize={pageSize}
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </CardContent>
    </Card>
  );
}
