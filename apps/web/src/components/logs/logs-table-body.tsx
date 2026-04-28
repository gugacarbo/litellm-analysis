import type { SpendLog } from '../../types/analytics';
import { TableBody, TableCell, TableRow } from '../table';
import { renderLogCell } from './logs-table-cell';
import type { TableColumn } from './logs-table-columns';
import { LogsTableGroupRenderer } from './logs-table-group-renderer';
import { LogsTableSkeleton } from './logs-table-skeleton';
import type { LogGroup } from './logs-table-utils';
import { calculateGroupSummary } from './logs-table-utils';

type LogsTableBodyProps = {
  loading: boolean;
  logs: SpendLog[];
  groupedLogs: LogGroup[] | null;
  expandedGroups: Record<string, boolean>;
  tableColumns: TableColumn[];
  showGroupExpanderColumn: boolean;
  onToggleGroup: (groupKey: string) => void;
  onSelectLog: (log: SpendLog) => void;
};

export function LogsTableBody({
  loading,
  logs,
  groupedLogs,
  expandedGroups,
  tableColumns,
  showGroupExpanderColumn,
  onToggleGroup,
  onSelectLog,
}: LogsTableBodyProps) {
  if (loading && logs.length === 0) {
    return (
      <TableBody>
        <LogsTableSkeleton
          showGroupExpanderColumn={showGroupExpanderColumn}
          tableColumns={tableColumns}
        />
      </TableBody>
    );
  }

  if (logs.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell
            colSpan={
              tableColumns.length + (showGroupExpanderColumn ? 1 : 0)
            }
            className='py-8 text-center text-muted-foreground'
          >
            No logs found
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (groupedLogs) {
    return (
      <TableBody>
        {groupedLogs.map((group) => {
          const groupKey = `${group.model}-${group.logs[0].request_id}`;
          const isExpanded = expandedGroups[groupKey] ?? false;
          const summary = calculateGroupSummary(group);

          return (
            <LogsTableGroupRenderer
              key={groupKey}
              group={group}
              groupKey={groupKey}
              isExpanded={isExpanded}
              summary={summary}
              tableColumns={tableColumns}
              showGroupExpanderColumn={showGroupExpanderColumn}
              onToggleGroup={() => onToggleGroup(groupKey)}
              onSelectLog={onSelectLog}
            />
          );
        })}
      </TableBody>
    );
  }

  return (
    <TableBody>
      {logs.map((log) => (
        <TableRow
          key={log.request_id}
          className='cursor-pointer hover:bg-muted/50'
          onClick={() => onSelectLog(log)}
        >
          {tableColumns.map((column) => (
            <TableCell
              key={`${log.request_id}-${column.key}`}
              className={
                column.align === 'right' ? 'text-right' : ''
              }
            >
              {renderLogCell({
                log,
                columnKey: column.key,
              })}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
