import { Search } from "lucide-react";

type ModelStatsHeaderProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export function ModelStatsHeader({
  searchQuery,
  onSearchChange,
}: ModelStatsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter models..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-52 rounded-md border bg-background py-1.5 pr-3 pl-8 text-sm"
        />
      </div>
    </div>
  );
}
