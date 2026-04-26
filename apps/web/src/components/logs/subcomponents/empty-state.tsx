import { TableCell, TableRow } from '../../table';

type EmptyStateProps = {
  tableColumnsLength: number;
  message?: string;
};

export function EmptyState({
  tableColumnsLength,
  message = 'No logs found',
}: EmptyStateProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={tableColumnsLength}
        className="py-8 text-center text-muted-foreground"
      >
        {message}
      </TableCell>
    </TableRow>
  );
}
