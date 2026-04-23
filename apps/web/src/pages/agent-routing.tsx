'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Settings,
  Database,
  ChevronDown,
  ChevronUp,
  Pencil,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/button';
import { FeatureGate } from '../components/feature-gate';
import { Card, CardContent, CardHeader, CardTitle } from '../components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/table';
import { Input } from '../components/input';
import { Skeleton } from '../components/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/tabs';
import {
  getAgentRoutingConfig,
  updateAgentRoutingConfig,
  getAllModels,
} from '../lib/api-client';
import {
  AGENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
  type AgentRoutingConfig,
  type AgentDefinition,
  type CategoryDefinition,
} from '../types/agent-routing';
import type { ModelConfig } from '../lib/api-client';

const KNOWN_KEYS = new Set([
  ...AGENT_DEFINITIONS.map((a) => a.key),
  ...CATEGORY_DEFINITIONS.map((c) => c.key),
]);

export function AgentRoutingPage() {
  const [aliases, setAliases] = useState<AgentRoutingConfig>({});
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<'agent' | 'category' | null>(
    null,
  );
  const [editingKey, setEditingKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [categoriesVisible, setCategoriesVisible] = useState(false);

  const [aliasDialogOpen, setAliasDialogOpen] = useState(false);
  const [aliasDialogMode, setAliasDialogMode] = useState<'add' | 'edit'>('add');
  const [aliasDialogKey, setAliasDialogKey] = useState('');
  const [aliasDialogValue, setAliasDialogValue] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [configData, modelsData] = await Promise.all([
          getAgentRoutingConfig(),
          getAllModels(),
        ]);
        setAliases(configData);
        setModels(modelsData);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const customAliases = useMemo(() => {
    return Object.entries(aliases).filter(
      ([key]) => !KNOWN_KEYS.has(key),
    );
  }, [aliases]);

  const openEdit = (
    type: 'agent' | 'category',
    key: string,
    currentModel?: string,
  ) => {
    setEditingType(type);
    setEditingKey(key);
    setSelectedModel(currentModel || '__unassigned__');
    setDialogOpen(true);
  };

  const getDialogTitle = () => {
    if (editingType === 'agent') {
      return 'Edit Agent Model Assignment';
    }
    return 'Edit Category Model Assignment';
  };

  const handleSave = useCallback(async () => {
    if (!editingKey || editingType === null) return;

    const updateValue =
      selectedModel === '__unassigned__' ? '' : selectedModel;
    setSaving(true);
    try {
      await updateAgentRoutingConfig({ [editingKey]: updateValue });
      setAliases((prev) => {
        const next = { ...prev };
        if (updateValue) {
          next[editingKey] = updateValue;
        } else {
          delete next[editingKey];
        }
        return next;
      });
      setDialogOpen(false);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }, [editingKey, selectedModel, editingType]);

  const getCurrentModel = (key: string): string | undefined => {
    return aliases[key];
  };

  const openAddAlias = () => {
    setAliasDialogMode('add');
    setAliasDialogKey('');
    setAliasDialogValue('');
    setAliasDialogOpen(true);
  };

  const openEditAlias = (key: string, value: string) => {
    setAliasDialogMode('edit');
    setAliasDialogKey(key);
    setAliasDialogValue(value);
    setAliasDialogOpen(true);
  };

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Agent Routing
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure which models are assigned to each agent and category
          </p>
        </div>
      </div>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">Agents & Categories</TabsTrigger>
          <TabsTrigger value="aliases">Custom Aliases</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <div className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && <div className="p-4 text-destructive">Error: {error}</div>}

                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Current Model</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {AGENT_DEFINITIONS.map((agent: AgentDefinition) => {
                        const currentModel = getCurrentModel(agent.key);
                        return (
                          <TableRow key={agent.key}>
                            <TableCell className="font-medium flex items-center gap-2">
                              <span>{agent.icon}</span>
                              <span>{agent.name}</span>
                            </TableCell>
                            <TableCell>{agent.description}</TableCell>
                            <TableCell>
                              {currentModel ? (
                                currentModel
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                                  Unassigned
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <FeatureGate capability="agentRouting">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    openEdit('agent', agent.key, currentModel)
                                  }
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </FeatureGate>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Button
                  variant="ghost"
                  className="flex items-center justify-between w-full p-0 h-auto"
                  onClick={() => setCategoriesVisible(!categoriesVisible)}
                >
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Categories ({CATEGORY_DEFINITIONS.length})
                  </CardTitle>
                  {categoriesVisible ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>
              </CardHeader>
              {categoriesVisible && (
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Current Model</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {CATEGORY_DEFINITIONS.map((category: CategoryDefinition) => {
                          const currentModel = getCurrentModel(category.key);
                          return (
                            <TableRow key={category.key}>
                              <TableCell className="font-medium">
                                {category.name}
                              </TableCell>
                              <TableCell>{category.description}</TableCell>
                              <TableCell>
                                {currentModel ? (
                                  currentModel
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                                    Unassigned
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <FeatureGate capability="agentRouting">
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() =>
                                      openEdit('category', category.key, currentModel)
                                    }
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </FeatureGate>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="aliases">
          <div className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Custom Aliases
                </CardTitle>
                <FeatureGate capability="agentRouting">
                  <Button onClick={openAddAlias} size="sm">
                    <Plus className="h-4 w-4" />
                    Add Alias
                  </Button>
                </FeatureGate>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : customAliases.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No custom aliases configured. Add one to route additional model names.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alias</TableHead>
                        <TableHead>Routes To</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customAliases.map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-mono font-medium">{key}</TableCell>
                          <TableCell className="font-mono">{value}</TableCell>
                          <TableCell>
                            <FeatureGate capability="agentRouting">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => openEditAlias(key, value)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleAliasDelete(key)}
                                  disabled={saving}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </FeatureGate>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unassigned__">Unassigned</SelectItem>
                  {models.map((model: ModelConfig) => (
                    <SelectItem key={model.modelName} value={model.modelName}>
                      {model.modelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin me-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aliasDialogOpen} onOpenChange={setAliasDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {aliasDialogMode === 'add' ? 'Add Custom Alias' : 'Edit Custom Alias'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="alias-key" className="text-sm font-medium">
                Alias
              </label>
              <Input
                id="alias-key"
                value={aliasDialogKey}
                onChange={(e) => setAliasDialogKey(e.target.value)}
                placeholder="e.g. my-model-alias"
                disabled={aliasDialogMode === 'edit'}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="alias-value" className="text-sm font-medium">
                Routes To
              </label>
              <Input
                id="alias-value"
                value={aliasDialogValue}
                onChange={(e) => setAliasDialogValue(e.target.value)}
                placeholder="e.g. gpt-4"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAliasDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAliasSave}
              disabled={saving || !aliasDialogKey.trim() || !aliasDialogValue.trim()}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin me-2" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AgentRoutingPage;