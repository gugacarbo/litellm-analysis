import Form from "@rjsf/core";
import type { FieldProps, RJSFSchema, UiSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { useMemo } from "react";
import {
  BooleanWidget,
  NumberWidget,
  SelectWidget,
  StringWidget,
} from "./widgets";

interface JsonSchemaFormProps {
  schema: Record<string, unknown>;
  formData: Record<string, unknown>;
  onChange: (data: { formData?: Record<string, unknown> }) => void;
}

export function JsonSchemaForm({
  schema,
  formData,
  onChange,
}: JsonSchemaFormProps) {
  const uiSchema: UiSchema = useMemo(() => {
    const ui: UiSchema = {
      "ui:submitButtonOptions": { norender: true },
    };

    if (schema.properties) {
      for (const key of Object.keys(schema.properties)) {
        if (key === "$schema" || key.startsWith("$")) {
          ui[key] = { "ui:widget": "hidden" };
        }
      }
    }

    return ui;
  }, [schema]);

  const widgets = useMemo(
    () => ({
      TextWidget: StringWidget,
      TextareaWidget: StringWidget,
      UpDownWidget: NumberWidget,
      SelectWidget,
      CheckboxWidget: BooleanWidget,
    }),
    [],
  );

  const fields = useMemo(
    () => ({
      TitleField: (props: FieldProps) => {
        const { title } = props;
        return title ? <h3 className="text-lg font-medium">{title}</h3> : null;
      },
      DescriptionField: (props: FieldProps) => {
        const { description } = props;
        return description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null;
      },
    }),
    [],
  );

  return (
    <div className="space-y-4">
      <Form
        schema={schema as RJSFSchema}
        uiSchema={uiSchema}
        formData={formData}
        validator={validator}
        widgets={widgets}
        fields={fields}
        onChange={onChange}
        liveValidate
        noHtml5Validate
      />
    </div>
  );
}
