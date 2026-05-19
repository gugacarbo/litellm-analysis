interface JsonSchemaFormProps {
  schema: unknown;
  formData: Record<string, unknown>;
  onChange: (data: { formData: Record<string, unknown> }) => void;
}

export function JsonSchemaForm({
  schema: _schema,
  formData: _formData,
  onChange: _onChange,
}: JsonSchemaFormProps) {
  void _schema;
  void _formData;
  void _onChange;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">JSON Schema Form</h3>
      <p className="text-sm text-muted-foreground">
        JSON Schema configuration form (placeholder)
      </p>
    </div>
  );
}
