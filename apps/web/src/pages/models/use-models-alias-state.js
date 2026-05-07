import { useState } from "react";
export function useModelsAliasState() {
  const [aliasDialogOpen, setAliasDialogOpen] = useState(false);
  const [aliasDialogMode, setAliasDialogMode] = useState("add");
  const [aliasDialogKey, setAliasDialogKey] = useState("");
  const [aliasDialogValue, setAliasDialogValue] = useState("");
  const [aliasMutationError, setAliasMutationError] = useState(null);
  function openAddAlias() {
    setAliasDialogMode("add");
    setAliasDialogKey("");
    setAliasDialogValue("");
    setAliasMutationError(null);
    setAliasDialogOpen(true);
  }
  function openEditAlias(key, value) {
    setAliasDialogMode("edit");
    setAliasDialogKey(key);
    setAliasDialogValue(value);
    setAliasMutationError(null);
    setAliasDialogOpen(true);
  }
  return {
    aliasDialogKey,
    aliasDialogMode,
    aliasDialogOpen,
    aliasDialogValue,
    aliasMutationError,
    openAddAlias,
    openEditAlias,
    setAliasDialogKey,
    setAliasDialogOpen,
    setAliasDialogValue,
    setAliasMutationError,
  };
}
