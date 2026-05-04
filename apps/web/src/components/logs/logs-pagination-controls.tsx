import type { PaginationMetadata } from "@lite-llm/api-contracts/analytics";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type LogsPaginationControlsProps = {
  page: number;
  pageSize: number;
  pagination: PaginationMetadata;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: string) => void;
};

export function LogsPaginationControls({
  page,
  pageSize,
  pagination,
  onPageChange,
  onPageSizeChange,
}: LogsPaginationControlsProps) {
  const isAll = pageSize === 0;
  const hasEntries = pagination.total > 0;
  const startEntry = hasEntries
    ? (page - 1) * (isAll ? pagination.total : pageSize) + 1
    : 0;
  const endEntry = isAll
    ? pagination.total
    : hasEntries
      ? Math.min(page * pageSize, pagination.total)
      : 0;
  const totalPages = isAll ? 1 : pagination.total_pages || 1;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
      <div className="text-sm text-muted-foreground">
        {isAll
          ? `Showing all ${pagination.total} entries`
          : `Showing ${startEntry}-${endEntry} of ${pagination.total} entries`}
      </div>

      <div className="flex items-center gap-2">
        {!isAll && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>

            <span className="text-sm px-2">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </>
        )}

        <Select value={pageSize.toString()} onValueChange={onPageSizeChange}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10/page</SelectItem>
            <SelectItem value="25">25/page</SelectItem>
            <SelectItem value="50">50/page</SelectItem>
            <SelectItem value="100">100/page</SelectItem>
            <SelectItem value="200">200/page</SelectItem>
            <SelectItem value="500">500/page</SelectItem>
            <SelectItem value="1000">1000/page</SelectItem>
            <SelectItem value="0">All</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
