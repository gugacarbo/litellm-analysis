import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteAgentConfig,
  getAgentConfig,
  getAgentRoutingConfig,
  saveAllAgentConfigs,
  updateAgentConfig,
  updateAgentRoutingConfig,
} from '../../lib/api-client';
import {
  AGENT_DEFINITIONS,
  type AgentConfig,
  type AgentRoutingConfig,
  CATEGORY_DEFINITIONS,
  type CategoryConfig,
} from '../../types/agent-routing';

const KNOWN_KEYS = new Set([
  ...AGENT_DEFINITIONS.map((a) => a.key),
  ...CATEGORY_DEFINITIONS.map((c) => c.key),
]);

type ConfigInfo = {
  model: string;
  description?: string;
  color?: string;
  fallbackCount: number;
};

export function useAgentRoutingPageState() {
  const [aliases, setAliases] = useState<AgentRoutingConfig>({});
  const [agentConfigs, setAgentConfigs] = useState<Record<string, AgentConfig>>(
    {},
  );
  const [categoryConfigs, setCategoryConfigs] = useState<
    Record<string, CategoryConfig>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoriesVisible, setCategoriesVisible] = useState(false);

  const [agentConfigDialogOpen, setAgentConfigDialogOpen] = useState(false);
  const [categoryConfigDialogOpen, setCategoryConfigDialogOpen] =
    useState(false);
  const [editingAgentKey, setEditingAgentKey] = useState('');
  const [editingCategoryKey, setEditingCategoryKey] = useState('');

  const [aliasDialogOpen, setAliasDialogOpen] = useState(false);
  const [aliasDialogMode, setAliasDialogMode] = useState<'add' | 'edit'>('add');
  const [aliasDialogKey, setAliasDialogKey] = useState('');
  const [aliasDialogValue, setAliasDialogValue] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [routingConfig, configData] = await Promise.all([
          getAgentRoutingConfig(),
          getAgentConfig(),
        ]);
        setAliases(routingConfig);
        setAgentConfigs(configData.agents || {});
        setCategoryConfigs(configData.categories || {});
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const resolveModelName = useCallback(
    (model: string | undefined) => {
      if (!model) return '';
      if (model.startsWith('litellm/') && aliases[model]) {
        return aliases[model];
      }
      return model;
    },
    [aliases],
  );

  const resolvedAgentConfigs = useMemo<Record<string, AgentConfig>>(() => {
    const result: Record<string, AgentConfig> = {};

    for (const [key, config] of Object.entries(agentConfigs)) {
      result[key] = {
        ...config,
        model: resolveModelName(config.model),
        fallback_models: (config.fallback_models || []).map(resolveModelName),
      };
    }

    return result;
  }, [agentConfigs, resolveModelName]);

  const resolvedCategoryConfigs = useMemo<
    Record<string, CategoryConfig>
  >(() => {
    const result: Record<string, CategoryConfig> = {};

    for (const [key, config] of Object.entries(categoryConfigs)) {
      result[key] = {
        ...config,
        model: resolveModelName(config.model),
        fallback_models: (config.fallback_models || []).map(resolveModelName),
      };
    }

    return result;
  }, [categoryConfigs, resolveModelName]);

  const customAliases = useMemo(
    () => Object.entries(aliases).filter(([key]) => !KNOWN_KEYS.has(key)),
    [aliases],
  );

  const handleSaveAgentConfig = useCallback(
    async (config: AgentConfig) => {
      setSaving(true);
      setError(null);

      try {
        await updateAgentConfig(editingAgentKey, 'agent', config, true);
        setAgentConfigs((prev) => ({ ...prev, [editingAgentKey]: config }));
        setAgentConfigDialogOpen(false);
      } catch (err) {
        setError(String(err));
      } finally {
        setSaving(false);
      }
    },
    [editingAgentKey],
  );

  const handleSaveCategoryConfig = useCallback(
    async (config: CategoryConfig) => {
      setSaving(true);
      setError(null);

      try {
        await updateAgentConfig(editingCategoryKey, 'category', config, true);
        setCategoryConfigs((prev) => ({
          ...prev,
          [editingCategoryKey]: config,
        }));
        setCategoryConfigDialogOpen(false);
      } catch (err) {
        setError(String(err));
      } finally {
        setSaving(false);
      }
    },
    [editingCategoryKey],
  );

  const handleDeleteAgentConfig = useCallback(async (key: string) => {
    setSaving(true);
    setError(null);

    try {
      await deleteAgentConfig(key, 'agent');
      setAgentConfigs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDeleteCategoryConfig = useCallback(async (key: string) => {
    setSaving(true);
    setError(null);

    try {
      await deleteAgentConfig(key, 'category');
      setCategoryConfigs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }, []);

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      await saveAllAgentConfigs(agentConfigs, categoryConfigs);
    } catch (err) {
      setError(String(err));
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
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }, [aliasDialogKey, aliasDialogValue]);

  const handleAliasDelete = useCallback(async (key: string) => {
    setSaving(true);

    try {
      await updateAgentRoutingConfig({ [key]: '' });
      setAliases((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }, []);

  const getAgentConfigInfo = useCallback(
    (key: string): ConfigInfo | null => {
      const config = resolvedAgentConfigs[key];
      if (!config) return null;

      return {
        model: config.model || 'Unassigned',
        description: config.description,
        color: agentConfigs[key]?.color,
        fallbackCount: config.fallback_models?.length || 0,
      };
    },
    [agentConfigs, resolvedAgentConfigs],
  );

  const getCategoryConfigInfo = useCallback(
    (key: string): ConfigInfo | null => {
      const config = resolvedCategoryConfigs[key];
      if (!config) return null;

      return {
        model: config.model || 'Unassigned',
        description: config.description,
        fallbackCount: config.fallback_models?.length || 0,
      };
    },
    [resolvedCategoryConfigs],
  );

  return {
    loading,
    saving,
    error,
    categoriesVisible,
    customAliases,
    aliasDialogOpen,
    aliasDialogMode,
    aliasDialogKey,
    aliasDialogValue,
    agentConfigDialogOpen,
    categoryConfigDialogOpen,
    editingAgentKey,
    editingCategoryKey,
    resolvedAgentConfigs,
    resolvedCategoryConfigs,
    setCategoriesVisible,
    setAliasDialogOpen,
    setAliasDialogKey,
    setAliasDialogValue,
    setAgentConfigDialogOpen,
    setCategoryConfigDialogOpen,
    handleSaveAll,
    handleSaveAgentConfig,
    handleDeleteAgentConfig,
    handleSaveCategoryConfig,
    handleDeleteCategoryConfig,
    openAgentConfig,
    openCategoryConfig,
    openAddAlias,
    openEditAlias,
    handleAliasSave,
    handleAliasDelete,
    getAgentConfigInfo,
    getCategoryConfigInfo,
  };
}
