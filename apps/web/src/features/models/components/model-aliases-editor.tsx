import { Plus, Route, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface ModelAliasesEditorProps {
  aliases: string[];
  errorMessage?: string | null;
  loading: boolean;
  disabled?: boolean;
  onChange: (aliases: string[]) => void;
}

function getAliasIssue(
  alias: string,
  index: number,
  aliases: string[],
): string | null {
  const trimmedAlias = alias.trim();

  if (!trimmedAlias) {
    return "Alias cannot be empty.";
  }

  const duplicateIndex = aliases.findIndex(
    (candidate, candidateIndex) =>
      candidateIndex !== index &&
      candidate.trim().toLowerCase() === trimmedAlias.toLowerCase(),
  );

  if (duplicateIndex >= 0) {
    return "Alias must be unique within this routing list.";
  }

  return null;
}

export function ModelAliasesEditor({
  aliases,
  errorMessage = null,
  loading,
  disabled = false,
  onChange,
}: ModelAliasesEditorProps) {
  const handleAliasChange = (index: number, value: string) => {
    const nextAliases = aliases.map((alias, aliasIndex) =>
      aliasIndex === index ? value : alias,
    );
    onChange(nextAliases);
  };

  const handleAddAlias = () => {
    onChange([...aliases, ""]);
  };

  const handleRemoveAlias = (index: number) => {
    onChange(aliases.filter((_, aliasIndex) => aliasIndex !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Manual Routing Aliases
        </CardTitle>
        <CardDescription>
          Add alternate request names that should route to this model. These
          aliases only affect routing names and do not create model metadata.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-dashed bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">
            Use aliases for manual routing compatibility, like legacy client
            names or provider-specific handles. The model detail and metadata
            stay attached to the primary model name only.
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Loading saved aliases...
          </div>
        ) : aliases.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No manual aliases yet. Add one if requests should route here under
            additional names.
          </div>
        ) : (
          <div className="space-y-3">
            {aliases.map((alias, index) => {
              const issue = getAliasIssue(alias, index, aliases);
              const inputId = `manual-alias-${index}`;

              return (
                <div key={inputId} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label htmlFor={inputId}>Alias {index + 1}</Label>
                      <Input
                        id={inputId}
                        value={alias}
                        onChange={(event) =>
                          handleAliasChange(index, event.target.value)
                        }
                        placeholder="e.g., gpt-4o-latest"
                        disabled={disabled}
                        aria-invalid={issue ? true : undefined}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="mt-7"
                      onClick={() => handleRemoveAlias(index)}
                      disabled={disabled}
                      aria-label={`Remove alias ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {issue ?? "Requests using this exact name will route here."}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={handleAddAlias}
          disabled={disabled || loading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add alias
        </Button>
      </CardContent>
    </Card>
  );
}
