import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ModelAliasesEditor } from "../model-aliases-editor";

interface ModelRoutingTabProps {
  aliases: string[];
  loading: boolean;
  error: string | null;
  disabled: boolean;
  onChange: (next: string[]) => void;
}

export function ModelRoutingTab({
  aliases,
  loading,
  error,
  disabled,
  onChange,
}: ModelRoutingTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Routing Aliases</CardTitle>
        <CardDescription>
          Aliases that route to this model. These are internal routing names
          only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ModelAliasesEditor
          aliases={aliases}
          loading={loading}
          errorMessage={error}
          disabled={disabled}
          onChange={onChange}
        />
      </CardContent>
    </Card>
  );
}
