import { formatCategoryLabel } from "@/features/agent-routing/utils";
import { Switch } from "@/components/ui/switch";

interface CategoryExportListProps {
  categories: string[];
  mappings: Record<string, boolean>;
  onToggle: (categoryId: string) => void;
}

export function CategoryExportList({
  categories,
  mappings,
  onToggle,
}: CategoryExportListProps) {
  if (categories.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Category Export</h3>
      <p className="text-sm text-muted-foreground">
        Choose which categories to export in this plugin.
      </p>
      <div className="space-y-2">
        {categories.map((category) => (
          <div
            key={category}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <span className="text-sm">{formatCategoryLabel(category)}</span>
            <Switch
              checked={mappings[category] ?? false}
              onCheckedChange={() => onToggle(category)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
