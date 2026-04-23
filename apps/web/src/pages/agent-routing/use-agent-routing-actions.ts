import { useCallback, useState } from 'react';
import {
  deleteAgentConfig,
  saveAllAgentConfigs,
  updateAgentConfig,
  updateAgentRoutingConfig,
} from '../../lib/api-client';
import type {
  AgentConfig,
  AgentRoutingConfig,
  CategoryConfig,
} from '../../types/agent-routing';

type SetAliases = (
  aliases:
    | AgentRoutingConfig
    | ((prev: AgentRoutingConfig) => AgentRoutingConfig),
) => void;
type SetAgentConfigs = (
  configs:
    | Record<string, AgentConfig>
    | ((prev: Record<string, AgentConfig>) => Record<string, AgentConfig>),
) => void;
type SetCategoryConfigs = (
  configs:
    | Record<string, CategoryConfig>
    | ((
        prev: Record<string, CategoryConfig>,
      ) => Record<string, CategoryConfig>),
) => void;

export function useAgentRoutingActions(
  _aliases: Record<string, string>,
  setAliases: SetAliases,
  agentConfigs: Record<string, AgentConfig>,
  setAgentConfigs: SetAgentConfigs,
  categoryConfigs: Record<string, CategoryConfig>,
  setCategoryConfigs: SetCategoryConfigs,
) {
  const [saving, setSaving] = useState(false);
  const [agentConfigDialogOpen, setAgentConfigDialogOpen] = useState(false);
  const [categoryConfigDialogOpen, setCategoryConfigDialogOpen] =
    useState(false);
  const [editingAgentKey, setEditingAgentKey] = useState('');
  const [editingCategoryKey, setEditingCategoryKey] = useState('');
  const [aliasDialogOpen, setAliasDialogOpen] = useState(false);
  const [aliasDialogMode, setAliasDialogMode] = useState<'add' | 'edit'>('add');
  const [aliasDialogKey, setAliasDialogKey] = useState('');
  const [aliasDialogValue, setAliasDialogValue] = useState('');

  const handleSaveAgentConfig = useCallback(
    async (config: AgentConfig) => {
      setSaving(true);
      try {
        await updateAgentConfig(editingAgentKey, 'agent', config, true);
        setAgentConfigs((prev) => ({ ...prev, [editingAgentKey]: config }));
        setAgentConfigDialogOpen(false);
      } finally {
        setSaving(false);
      }
    },
    [editingAgentKey, setAgentConfigs],
  );

  const handleSaveCategoryConfig = useCallback(
    async (config: CategoryConfig) => {
      setSaving(true);
      try {
        await updateAgentConfig(editingCategoryKey, 'category', config, true);
        setCategoryConfigs((prev) => ({
          ...prev,
          [editingCategoryKey]: config,
        }));
        setCategoryConfigDialogOpen(false);
      } finally {
        setSaving(false);
      }
    },
    [editingCategoryKey, setCategoryConfigs],
  );

  const handleDeleteAgentConfig = useCallback(
    async (key: string) => {
      setSaving(true);
      try {
        await deleteAgentConfig(key, 'agent');
        setAgentConfigs((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } finally {
        setSaving(false);
      }
    },
    [setAgentConfigs],
  );

  const handleDeleteCategoryConfig = useCallback(
    async (key: string) => {
      setSaving(true);
      try {
        await deleteAgentConfig(key, 'category');
        setCategoryConfigs((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } finally {
        setSaving(false);
      }
    },
    [setCategoryConfigs],
  );

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    try {
      await saveAllAgentConfigs(agentConfigs, categoryConfigs);
    } finally {
      setSaving(false);
    }
  }, [agentConfigs, categoryConfigs]);

  const openAgentConfig = useCallback((key: string) => {
    setEditingAgentKey(key);
    setAgentConfigDialogOpen(true);
  }, []);

  const openCategoryConfig = useCallback((key: string) => {
    setEditingCategoryKey(key);
    setCategoryConfigDialogOpen(true);
  }, []);

  const openAddAlias = useCallback(() => {
    setAliasDialogMode('add');
    setAliasDialogKey('');
    setAliasDialogValue('');
    setAliasDialogOpen(true);
  }, []);

  const openEditAlias = useCallback((key: string, value: string) => {
    setAliasDialogMode('edit');
    setAliasDialogKey(key);
    setAliasDialogValue(value);
    setAliasDialogOpen(true);
  }, []);

  const handleAliasSave = useCallback(async () => {
    const key = aliasDialogKey.trim();
    const value = aliasDialogValue.trim();
    if (!key || !value) return;

    setSaving(true);
    try {
      await updateAgentRoutingConfig({ [key]: value });
      setAliases((prev) => ({ ...prev, [key]: value }));
      setAliasDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }, [aliasDialogKey, aliasDialogValue, setAliases]);

  const handleAliasDelete = useCallback(
    async (key: string) => {
      setSaving(true);
      try {
        await updateAgentRoutingConfig({ [key]: '' });
        setAliases((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } finally {
        setSaving(false);
      }
    },
    [setAliases],
  );

  return {
    saving,
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
    handleSaveAgentConfig,
    handleSaveCategoryConfig,
    handleDeleteAgentConfig,
    handleDeleteCategoryConfig,
    handleSaveAll,
    openAgentConfig,
    openCategoryConfig,
    openAddAlias,
    openEditAlias,
    handleAliasSave,
    handleAliasDelete,
  };
}
