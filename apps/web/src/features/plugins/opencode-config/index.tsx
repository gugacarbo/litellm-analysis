interface OpenCodeConfigPageProps {
  config: Record<string, unknown>;
  availableModels: { key: string; displayName: string }[];
  onChange: (key: string, value: unknown) => void;
}

export function OpenCodeConfigPage({
  config: _config,
  availableModels: _availableModels,
  onChange: _onChange,
}: OpenCodeConfigPageProps) {
  void _config;
  void _availableModels;
  void _onChange;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">OpenCode Configuration</h3>
      <p className="text-sm text-muted-foreground">
        OpenCode-specific plugin configuration
      </p>
    </div>
  );
}
