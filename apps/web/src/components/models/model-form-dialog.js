import { Plus, Trash2 } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
export function ModelFormDialog({
  open,
  onOpenChange,
  editingModel,
  formLoading,
  formError,
  formData,
  onOpenCreate,
  onFormDataChange,
  onAddExtraParam,
  onRemoveExtraParam,
  onUpdateExtraParam,
  onSubmit,
  credentials,
  defaultCredential,
}) {
  return _jsxs(Dialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: [
      _jsx(DialogTrigger, {
        asChild: true,
        children: _jsxs(Button, {
          onClick: onOpenCreate,
          children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Model"],
        }),
      }),
      _jsxs(DialogContent, {
        className: "sm:max-w-xl",
        children: [
          _jsxs(DialogHeader, {
            children: [
              _jsx(DialogTitle, {
                children: editingModel ? "Edit Model" : "Add New Model",
              }),
              _jsx(DialogDescription, {
                children: editingModel
                  ? `Update configuration for ${editingModel.modelName}`
                  : "Configure a new model in LiteLLM",
              }),
            ],
          }),
          _jsxs("div", {
            className: "grid gap-4 py-4",
            children: [
              _jsxs("div", {
                className: "grid gap-2",
                children: [
                  _jsx("label", {
                    htmlFor: "model-name",
                    className: "text-sm font-medium",
                    children: "Model Name",
                  }),
                  _jsx(Input, {
                    id: "model-name",
                    value: formData.modelName,
                    onChange: (e) =>
                      onFormDataChange({
                        ...formData,
                        modelName: e.target.value,
                      }),
                    placeholder: "e.g., gpt-4, claude-3-opus",
                    disabled: Boolean(editingModel),
                  }),
                ],
              }),
              _jsxs("div", {
                className: "grid gap-2",
                children: [
                  _jsx("label", {
                    htmlFor: "api-base",
                    className: "text-sm font-medium",
                    children: "API Base URL",
                  }),
                  _jsx(Input, {
                    id: "api-base",
                    value: formData.apiBase,
                    onChange: (e) =>
                      onFormDataChange({
                        ...formData,
                        apiBase: e.target.value,
                      }),
                    placeholder: "https://api.openai.com/v1",
                  }),
                ],
              }),
              _jsxs("div", {
                className: "grid gap-2",
                children: [
                  _jsxs("label", {
                    htmlFor: "credential",
                    className: "text-sm font-medium",
                    children: [
                      "Credential",
                      _jsx("span", {
                        className: "text-muted-foreground font-normal ml-1",
                        children: "(LiteLLM virtual key)",
                      }),
                    ],
                  }),
                  _jsxs(Select, {
                    value: formData.litellmCredentialName,
                    onValueChange: (value) =>
                      onFormDataChange({
                        ...formData,
                        litellmCredentialName: value === "none" ? "" : value,
                      }),
                    children: [
                      _jsx(SelectTrigger, {
                        id: "credential",
                        children: _jsx(SelectValue, {
                          placeholder: "Select a credential (optional)",
                        }),
                      }),
                      _jsxs(SelectContent, {
                        children: [
                          _jsx(SelectItem, {
                            value: "none",
                            children: _jsx("span", {
                              className: "text-muted-foreground",
                              children: "No credential",
                            }),
                          }),
                          credentials.map((cred) =>
                            _jsx(
                              SelectItem,
                              {
                                value: cred.credentialName,
                                children: _jsxs("div", {
                                  className: "flex flex-col",
                                  children: [
                                    _jsx("span", {
                                      children: cred.credentialName,
                                    }),
                                    cred.credentialInfo &&
                                      _jsx("span", {
                                        className:
                                          "text-xs text-muted-foreground",
                                        children: JSON.stringify(
                                          cred.credentialInfo,
                                        ).slice(0, 50),
                                      }),
                                  ],
                                }),
                              },
                              cred.credentialId,
                            ),
                          ),
                        ],
                      }),
                    ],
                  }),
                  defaultCredential &&
                    !editingModel &&
                    _jsxs("p", {
                      className: "text-xs text-muted-foreground",
                      children: ["Default: ", defaultCredential],
                    }),
                ],
              }),
              _jsxs("div", {
                className: "grid grid-cols-2 gap-4",
                children: [
                  _jsxs("div", {
                    className: "grid gap-2",
                    children: [
                      _jsxs("label", {
                        htmlFor: "input-cost",
                        className: "text-sm font-medium",
                        children: [
                          "Input Cost",
                          _jsx("span", {
                            className: "text-muted-foreground font-normal ml-1",
                            children: "($/token)",
                          }),
                        ],
                      }),
                      _jsx(Input, {
                        id: "input-cost",
                        type: "number",
                        step: "0.000001",
                        min: "0",
                        value: formData.inputCostPerToken,
                        onChange: (e) =>
                          onFormDataChange({
                            ...formData,
                            inputCostPerToken: e.target.value,
                          }),
                        placeholder: "0.00",
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "grid gap-2",
                    children: [
                      _jsxs("label", {
                        htmlFor: "output-cost",
                        className: "text-sm font-medium",
                        children: [
                          "Output Cost",
                          _jsx("span", {
                            className: "text-muted-foreground font-normal ml-1",
                            children: "($/token)",
                          }),
                        ],
                      }),
                      _jsx(Input, {
                        id: "output-cost",
                        type: "number",
                        step: "0.000001",
                        min: "0",
                        value: formData.outputCostPerToken,
                        onChange: (e) =>
                          onFormDataChange({
                            ...formData,
                            outputCostPerToken: e.target.value,
                          }),
                        placeholder: "0.00",
                      }),
                    ],
                  }),
                ],
              }),
              _jsxs("div", {
                className: "grid grid-cols-2 gap-4",
                children: [
                  _jsxs("div", {
                    className: "grid gap-2",
                    children: [
                      _jsxs("label", {
                        htmlFor: "context-window",
                        className: "text-sm font-medium",
                        children: [
                          "Context Window",
                          _jsx("span", {
                            className: "text-muted-foreground font-normal ml-1",
                            children: "(tokens)",
                          }),
                        ],
                      }),
                      _jsx(Input, {
                        id: "context-window",
                        type: "number",
                        step: "1",
                        min: "0",
                        value: formData.contextWindowSize,
                        onChange: (e) =>
                          onFormDataChange({
                            ...formData,
                            contextWindowSize: e.target.value,
                          }),
                        placeholder: "e.g., 200000",
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "grid gap-2",
                    children: [
                      _jsxs("label", {
                        htmlFor: "max-tokens",
                        className: "text-sm font-medium",
                        children: [
                          "Max Output",
                          _jsx("span", {
                            className: "text-muted-foreground font-normal ml-1",
                            children: "(tokens)",
                          }),
                        ],
                      }),
                      _jsx(Input, {
                        id: "max-tokens",
                        type: "number",
                        step: "1",
                        min: "0",
                        value: formData.maxTokens,
                        onChange: (e) =>
                          onFormDataChange({
                            ...formData,
                            maxTokens: e.target.value,
                          }),
                        placeholder: "e.g., 128000",
                      }),
                    ],
                  }),
                ],
              }),
              Object.keys(formData.extraParams).length > 0 &&
                _jsxs("div", {
                  className: "grid gap-3",
                  children: [
                    _jsx("span", {
                      className: "text-sm font-medium",
                      children: "Additional Parameters",
                    }),
                    Object.entries(formData.extraParams).map(([key, value]) =>
                      _jsxs(
                        "div",
                        {
                          className: "flex items-center gap-2",
                          children: [
                            _jsx(Input, {
                              value: key,
                              disabled: true,
                              className: "bg-muted font-mono text-sm",
                              placeholder: "param_name",
                            }),
                            _jsx(Input, {
                              value: value,
                              onChange: (e) =>
                                onUpdateExtraParam(key, e.target.value),
                              className: "font-mono text-sm",
                              placeholder: "value",
                            }),
                            _jsx(Button, {
                              type: "button",
                              variant: "ghost",
                              size: "icon-sm",
                              onClick: () => onRemoveExtraParam(key),
                              children: _jsx(Trash2, {
                                className: "h-4 w-4 text-destructive",
                              }),
                            }),
                          ],
                        },
                        key,
                      ),
                    ),
                  ],
                }),
              _jsxs(Button, {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: onAddExtraParam,
                className: "w-fit",
                children: [
                  _jsx(Plus, { className: "h-4 w-4 mr-2" }),
                  "Add Parameter",
                ],
              }),
              formError &&
                _jsx("p", {
                  className: "text-sm text-destructive",
                  children: formError,
                }),
            ],
          }),
          _jsxs(DialogFooter, {
            children: [
              _jsx(Button, {
                variant: "outline",
                onClick: () => onOpenChange(false),
                children: "Cancel",
              }),
              _jsx(Button, {
                onClick: onSubmit,
                disabled: formLoading,
                children: formLoading
                  ? "Saving..."
                  : editingModel
                    ? "Update"
                    : "Create",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
