import { useQueryClient } from "@tanstack/react-query";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { BenchmarkComparisonDialog } from "../components/benchmark-comparison-dialog";
import { ModelConfigForm } from "../components/model-config-form";
import { useBenchmarkComparison } from "../hooks/use-benchmark-comparison";
import { useModelConfigPageFromContext } from "../use-model-config-page";
import { useModelDetailContext } from "./model-detail-context";

const MAPPABLE_KEYS = new Set([
  "displayName",
  "family",
  "ownedBy",
  "apiMode",
  "vision",
  "inputCostPerToken",
  "outputCostPerToken",
]);

const COST_KEYS = new Set(["inputCostPerToken", "outputCostPerToken"]);

export function ModelDetailSettingsTab() {
  const { model, notFound } = useModelDetailContext();
  const controller = useModelConfigPageFromContext();
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: benchmarkData, isLoading: benchmarkLoading } =
    useBenchmarkComparison(model?.modelName ?? "");

  if (notFound || !model) {
    return null;
  }

  const hasMatch =
    benchmarkData?.matchedAaModel != null ||
    benchmarkData?.matchedOpenRouterModel != null;
  const buttonDisabled = benchmarkLoading || !hasMatch;

  const handleOpenComparison = () => {
    queryClient.invalidateQueries({
      queryKey: ["benchmark-comparison", model.modelName],
    });
    setComparisonOpen(true);
  };

  const handleImportField = (key: string, value: unknown, source: string) => {
    const targetKey = key;

    if (!MAPPABLE_KEYS.has(targetKey)) {
      toast.warning(`Campo "${key}" não pode ser importado automaticamente`);
      return;
    }

    const coercedValue =
      COST_KEYS.has(targetKey) && typeof value === "number"
        ? String(value)
        : value;

    controller.onFormDataChange({
      ...controller.formData,
      [targetKey]: coercedValue,
    });
    toast.success(`Campo "${targetKey}" importado de ${source}`);
  };

  return (
    <>
      <ModelConfigForm
        controller={controller}
        headerAction={
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={buttonDisabled}
                  onClick={handleOpenComparison}
                >
                  <Settings2 className="mr-2 h-4 w-4" />
                  Importar configs
                </Button>
              </span>
            </TooltipTrigger>
            {buttonDisabled && (
              <TooltipContent>
                {benchmarkLoading
                  ? "Carregando dados de benchmark..."
                  : "Nenhum benchmark encontrado para este modelo"}
              </TooltipContent>
            )}
          </Tooltip>
        }
      />

      {comparisonOpen && (
        <BenchmarkComparisonDialog
          open={comparisonOpen}
          onOpenChange={setComparisonOpen}
          modelName={model.modelName}
          onImportField={handleImportField}
        />
      )}
    </>
  );
}
