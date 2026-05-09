import { useCallback, useState } from "react";

export function useAgentRoutingDialogState() {
  const [agentConfigDialogOpen, setAgentConfigDialogOpen] = useState(false);
  const [categoryConfigDialogOpen, setCategoryConfigDialogOpen] =
    useState(false);
  const [editingAgentKey, setEditingAgentKey] = useState("");
  const [editingCategoryKey, setEditingCategoryKey] = useState("");
  const [aliasDialogOpen, setAliasDialogOpen] = useState(false);
  const [aliasDialogMode, setAliasDialogMode] = useState<"add" | "edit">("add");
  const [aliasDialogKey, setAliasDialogKey] = useState("");
  const [aliasDialogValue, setAliasDialogValue] = useState("");

  const openAgentConfig = useCallback((key: string) => {
    setEditingAgentKey(key);
    setAgentConfigDialogOpen(true);
  }, []);

  const openCategoryConfig = useCallback((key: string) => {
    setEditingCategoryKey(key);
    setCategoryConfigDialogOpen(true);
  }, []);

  const openAddAlias = useCallback(() => {
    setAliasDialogMode("add");
    setAliasDialogKey("");
    setAliasDialogValue("");
    setAliasDialogOpen(true);
  }, []);

  const openEditAlias = useCallback((key: string, value: string) => {
    setAliasDialogMode("edit");
    setAliasDialogKey(key);
    setAliasDialogValue(value);
    setAliasDialogOpen(true);
  }, []);

  return {
    agentConfigDialogOpen,
    categoryConfigDialogOpen,
    editingAgentKey,
    editingCategoryKey,
    aliasDialogOpen,
    aliasDialogMode,
    aliasDialogKey,
    aliasDialogValue,
    setAgentConfigDialogOpen,
    setCategoryConfigDialogOpen,
    setAliasDialogOpen,
    setAliasDialogKey,
    setAliasDialogValue,
    openAgentConfig,
    openCategoryConfig,
    openAddAlias,
    openEditAlias,
  };
}
