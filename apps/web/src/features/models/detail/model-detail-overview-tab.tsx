import { useParams } from "react-router-dom";
import { ModelDetailOverviewContent } from "../detail-index";

export function ModelDetailOverviewTab() {
  const { modelName } = useParams() as { modelName: string };
  return <ModelDetailOverviewContent modelName={modelName} />;
}