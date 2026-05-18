export interface InternalAgent {
  id: string;
  displayName: string;
  description: string;
}

export interface ConfigField {
  key: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "select"
    | "password"
    | "multiselect"
    | "switch-group";
  label: string;
  required?: boolean;
  default?: unknown;
  options?: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
}
