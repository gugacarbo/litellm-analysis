import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Settings, Database } from 'lucide-react';
import { Button } from '../components/button';
import { FeatureGate } from '../components/feature-gate';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/card';
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
import { getAgentRoutingConfig, updateAgentRoutingConfig, type AgentRoutingAPIResponse } from '../lib/api-client';

export function AgentRoutingPage() {
  const [aliases, setAliases] = useState<AgentRoutingAPIResponse>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<string>('');
  const [editingAlias, setEditingAlias] = useState<string>('');
  const [newModel, setNewModel] = useState('');
  const [newAlias, setNewAlias] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getAgentRoutingConfig();
        setAliases(data);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const openEdit = (model: string, alias: string) => {
    setEditingModel(model);
    setEditingAlias(alias);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingModel('');
    setEditingAlias('');
    setNewModel('');
    setNewAlias('');
    setDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingModel || !editingAlias) return;
    const updated = { ...aliases, [editingModel]: editingAlias };
    setSaving(true);
    try {
      await updateAgentRoutingConfig(updated);
      setAliases(updated);
      setDialogOpen(false);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newModel.trim() || !newAlias.trim()) return;
    const updated = { ...aliases, [newModel.trim()]: newAlias.trim() };
    setSaving(true);
    try {
      await updateAgentRoutingConfig(updated);
      setAliases(updated);
      setDialogOpen(false);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (model: string) => {
    const updated = { ...aliases };
    delete updated[model];
    setSaving(true);
    try {
      await updateAgentRoutingConfig(updated);
      setAliases(updated);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!editingModel;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Agent Routing
        </h1>
        <FeatureGate capability="agentRouting">
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Alias
          </Button>
        </FeatureGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Model Group Alias Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-4 text-destructive">Error: {error}</div>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(aliases).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No aliases configured
                    </TableCell>
                  </TableRow>
                )}
                {Object.entries(aliases).map(([model, alias]) => (
                  <TableRow key={model}>
                    <TableCell className="font-medium">{model}</TableCell>
                    <TableCell>{alias}</TableCell>
                    <TableCell className="text-right">
                      <FeatureGate capability="agentRouting">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(model, alias)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(model)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Alias' : 'Add Alias'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="model-input" className="text-sm font-medium">
                {isEditing ? 'Model' : 'Model'}
              </label>
              <Input
                id="model-input"
                value={isEditing ? editingModel : newModel}
                onChange={(e) => isEditing ? setEditingModel(e.target.value) : setNewModel(e.target.value)}
                placeholder="e.g. litellm/glm-5"
                disabled={isEditing}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="alias-input" className="text-sm font-medium">
                Alias
              </label>
              <Input
                id="alias-input"
                value={isEditing ? editingAlias : newAlias}
                onChange={(e) => isEditing ? setEditingAlias(e.target.value) : setNewAlias(e.target.value)}
                placeholder="e.g. glm-5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={isEditing ? handleSaveEdit : handleAdd}
              disabled={saving || (isEditing ? !editingAlias.trim() : (!newModel.trim() || !newAlias.trim()))}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AgentRoutingPage;
