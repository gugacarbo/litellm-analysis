import { ModelConfigForm } from "../components/model-config-form";
import { useModelConfigPageFromContext } from "../use-model-config-page";
import { useModelDetailContext } from "./model-detail-context";

export function ModelDetailSettingsTab() {
  const { model, notFound } = useModelDetailContext();
  const controller = useModelConfigPageFromContext();

  if (notFound || !model) {
    return null;
  }

  return <ModelConfigForm controller={controller} />;
}
