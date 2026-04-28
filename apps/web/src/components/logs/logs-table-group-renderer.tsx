import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { Fragment } from 'react';
import type { SpendLog } from '../../types/analytics';
import { TableCell, TableRow } from '../table';
import { renderLogCell } from './logs-table-cell';
import type { TableColumn } from './logs-table-columns';
import { renderGroupSummaryCell } from './logs-table-summary-row';
import type { GroupSummary, LogGroup } from './logs-table-utils';

type LogsTableGroupRendererProps = {
  group: LogGroup;
  groupKey: string;
  isExpanded: boolean;
  summary: GroupSummary;
  tableColumns: TableColumn[];
  showGroupExpanderColumn: boolean;
  onToggleGroup: () => void;
  onSelectLog: (log: SpendLog) => void;
};

export function LogsTableGroupRenderer({
  group,
  groupKey,
  isExpanded,
  summary,
  tableColumns,
  showGroupExpanderColumn,
  onToggleGroup,
  onSelectLog,
}: LogsTableGroupRendererProps) {
  const { model, logs: groupLogs } = group;

  return (
    <Fragment key={groupKey}>
      <TableRow
        className='cursor-pointer bg-muted/50 hover:bg-muted'
        onClick={onToggleGroup}
      >
        <TableCell className='w-10'>
          {isExpanded ? (
            <ChevronDownIcon className='h-4 w-4 text-muted-foreground' />
          ) : (
            <ChevronRightIcon className='h-4 w-4 text-muted-foreground' />
          )}
        </TableCell>
        {tableColumns.map((column) => (
          <TableCell
            key={column.key}
            className={column.align === 'right' ? 'text-right' : ''}
          >
            {renderGroupSummaryCell({ model, groupLogs, summary, column })}
          </TableCell>
        ))}
      </TableRow>
      {isExpanded &&
        groupLogs.map((log) => (
          <TableRow
            key={log.request_id}
            className='cursor-pointer hover:bg-muted/50'
            onClick={() => onSelectLog(log)}
          >
            {showGroupExpanderColumn ? (
              <TableCell className='w-10' />
            ) : null}
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
    </Fragment>
  );
}
