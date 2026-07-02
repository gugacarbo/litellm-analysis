import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useProvidersPage } from "./use-providers-page";

export function ProvidersPage() {
  const {
    providers,
    providerDefaultProvider,
    providerLoading,
    providerSaving,
    handleProviderDefaultProviderChange,
    openAiOAuthConnection,
    openAiOAuthPending,
    openAiOAuthDeviceFlow,
    openAiOAuthLoading,
    openAiOAuthBusy,
    openAiOAuthError,
    handleStartOpenAiOAuth,
    handleCancelOpenAiOAuth,
    handleDisconnectOpenAiOAuth,
    providerFormOpen,
    setProviderFormOpen,
    editingProvider,
    providerFormData,
    setProviderFormData,
    providerFormError,
    providerFormLoading,
    handleOpenCreateProvider,
    handleOpenEditProvider,
    handleProviderFormSubmit,
    handleDeleteProvider,
    deleteProviderLoading,
    discoverModelsOpen,
    setDiscoverModelsOpen,
    discoverModelsSource,
    discoverModelsResult,
    discoverModelsLoading,
    discoverModelsError,
    handleDiscoverModels,
    handleDiscoverProviderModels,
    testModelId,
    testPrompt,
    setTestPrompt,
    testResult,
    testError,
    testLoading,
    handleTestModel,
    handleRunTest,
    registerModelsLoading,
    registerModelsResult,
    registerModelsError,
    handleRegisterModels,
    handleRegisterSingleModel,
    existingModelIds,
  } = useProvidersPage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Providers</h1>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Proxy Providers</h2>
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => {
              void handleOpenCreateProvider();
            }}
          >
            <Plus className="mr-1.5 h-3 w-3" />
            Add
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage providers used by the proxy to authenticate with model
          providers. API keys are encrypted at rest and are never shown again
          after saving.
        </p>

        {providers.length === 0 ? (
          <div className="rounded-md border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No providers configured. Click "Add" to create one.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>Stored Secret</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((cred) => (
                  <TableRow key={cred.providerId}>
                    <TableCell className="font-mono text-xs">
                      {cred.providerName}
                      {providerDefaultProvider === cred.providerName && (
                        <Badge
                          variant="success"
                          className="ml-2 text-[10px] px-1.5 py-0"
                        >
                          default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {cred.provider ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {cred.baseUrl ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {cred.hasStoredSecret ? (
                        <Badge variant="outline">Stored securely</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            void handleDiscoverProviderModels(cred);
                          }}
                          title="Discover provider models"
                        >
                          <Search className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            void handleOpenEditProvider(cred);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={deleteProviderLoading}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Provider
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete{" "}
                                <span className="font-semibold">
                                  {cred.providerName}
                                </span>
                                ? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    void handleDeleteProvider(
                                      cred.providerName,
                                    );
                                  }}
                                >
                                  Delete
                                </Button>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {providerFormOpen && (
          <div className="space-y-3 rounded-md border p-4">
            <p className="text-sm font-medium">
              {editingProvider ? "Edit Provider" : "Add Provider"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label htmlFor="cred-name" className="text-xs font-medium">
                  Name
                </Label>
                <Input
                  id="cred-name"
                  value={providerFormData.name}
                  onChange={(e) => {
                    setProviderFormData({
                      ...providerFormData,
                      name: e.target.value,
                    });
                  }}
                  placeholder="e.g., openai-prod"
                  disabled={Boolean(editingProvider)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="cred-provider" className="text-xs font-medium">
                  Provider
                </Label>
                <Input
                  id="cred-provider"
                  value={providerFormData.provider ?? ""}
                  onChange={(e) => {
                    setProviderFormData({
                      ...providerFormData,
                      provider: e.target.value || null,
                    });
                  }}
                  placeholder="e.g., openai"
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="cred-baseurl" className="text-xs font-medium">
                  Base URL
                </Label>
                <Input
                  id="cred-baseurl"
                  value={providerFormData.baseUrl ?? ""}
                  onChange={(e) => {
                    setProviderFormData({
                      ...providerFormData,
                      baseUrl: e.target.value || null,
                    });
                  }}
                  placeholder="https://api.openai.com/v1"
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="cred-apikey" className="text-xs font-medium">
                  API Key
                </Label>
                <Input
                  id="cred-apikey"
                  type="password"
                  autoComplete="new-password"
                  value={providerFormData.apiKey}
                  onChange={(e) => {
                    setProviderFormData({
                      ...providerFormData,
                      apiKey: e.target.value,
                    });
                  }}
                  placeholder={
                    editingProvider
                      ? "Leave blank to keep the stored key"
                      : "Paste provider API key"
                  }
                  className="h-8 text-sm font-mono"
                />
              </div>
            </div>
            {providerFormError && (
              <p className="text-xs text-destructive">{providerFormError}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProviderFormOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  void handleProviderFormSubmit();
                }}
                disabled={
                  providerFormLoading ||
                  !providerFormData.name ||
                  (!editingProvider && !providerFormData.apiKey)
                }
              >
                {providerFormLoading
                  ? "Saving..."
                  : editingProvider
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">OpenAI OAuth</h2>
        <div className="rounded-md border p-4 text-sm">
          {openAiOAuthLoading ? (
            <p className="text-muted-foreground">Carregando status...</p>
          ) : openAiOAuthConnection.connected ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">Connected</Badge>
                {openAiOAuthConnection.accountId ? (
                  <span className="font-mono text-xs">
                    {openAiOAuthConnection.accountId}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Use <span className="font-mono">ownedBy</span> ou{" "}
                <span className="font-mono">family</span> ={" "}
                <span className="font-mono">chatgpt-subscription</span> para
                rotear um modelo pelo plano Codex via{" "}
                <span className="font-mono">/v1/responses</span>.
              </p>
              {openAiOAuthConnection.expiresAt ? (
                <p className="text-xs text-muted-foreground">
                  Expira em{" "}
                  {new Date(openAiOAuthConnection.expiresAt).toLocaleString()}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectOpenAiOAuth}
                  disabled={openAiOAuthBusy}
                >
                  Desconectar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void handleDiscoverModels();
                  }}
                  disabled={discoverModelsLoading || openAiOAuthBusy}
                >
                  <Search className="mr-1.5 h-3 w-3" />
                  Descobrir modelos
                </Button>
              </div>
            </div>
          ) : openAiOAuthPending && openAiOAuthDeviceFlow ? (
            <div className="space-y-2">
              <p>
                Abra{" "}
                <a
                  href={openAiOAuthDeviceFlow.verificationUri}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {openAiOAuthDeviceFlow.verificationUri}
                </a>{" "}
                e informe o código:
              </p>
              <div className="rounded bg-muted px-3 py-2 font-mono text-lg tracking-[0.25em]">
                {openAiOAuthDeviceFlow.userCode}
              </div>
              <p className="text-xs text-muted-foreground">
                Verificando automaticamente até{" "}
                {new Date(openAiOAuthDeviceFlow.expiresAt).toLocaleString()}.
              </p>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelOpenAiOAuth}
                  disabled={openAiOAuthBusy}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Conecte uma conta OpenAI/ChatGPT para rotear modelos pelo plano
                Codex usando <span className="font-mono">/v1/responses</span>.
              </p>
              <Button
                size="sm"
                onClick={handleStartOpenAiOAuth}
                disabled={openAiOAuthBusy}
              >
                Conectar com OpenAI
              </Button>
            </div>
          )}
          {openAiOAuthError ? (
            <p className="mt-2 text-xs text-destructive">{openAiOAuthError}</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Default Provider</h2>
        <p className="text-sm text-muted-foreground">
          Set the default provider applied to all models that don{"'"}t have an
          explicit provider configured.
        </p>
        <Select
          value={providerDefaultProvider || "none"}
          onValueChange={(value) => {
            void handleProviderDefaultProviderChange(
              value === "none" ? "" : value,
            );
          }}
          disabled={providerLoading || providerSaving}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Default provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem provider padrão</SelectItem>
            {providers.map((provider) => (
              <SelectItem
                key={provider.providerId}
                value={provider.providerName}
              >
                {provider.providerName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <Dialog open={discoverModelsOpen} onOpenChange={setDiscoverModelsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {discoverModelsSource?.kind === "provider"
                ? `Models for ${discoverModelsSource.providerName}`
                : "OpenAI Models"}
            </DialogTitle>
            <DialogDescription>
              {discoverModelsSource?.kind === "provider"
                ? `Models available from ${
                    discoverModelsSource.provider || "this provider"
                  } using the selected provider.`
                : "Models available on the connected OpenAI account."}
            </DialogDescription>
          </DialogHeader>
          {discoverModelsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : discoverModelsError ? (
            <p className="text-sm text-destructive">{discoverModelsError}</p>
          ) : discoverModelsResult.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No models discovered.
            </p>
          ) : (
            <div className="space-y-4">
              {registerModelsResult && (
                <div className="rounded-md border bg-muted/50 p-3 text-xs">
                  <p className="font-medium">
                    Registered {registerModelsResult.registered.length} model
                    {registerModelsResult.registered.length === 1 ? "" : "s"}
                    {registerModelsResult.skipped.length > 0 &&
                      ` (${registerModelsResult.skipped.length} skipped)`}
                  </p>
                  {registerModelsResult.skipped.length > 0 && (
                    <p className="mt-1 text-muted-foreground">
                      Skipped (already exist):{" "}
                      {registerModelsResult.skipped.join(", ")}
                    </p>
                  )}
                </div>
              )}
              {registerModelsError && (
                <p className="text-xs text-destructive">
                  {registerModelsError}
                </p>
              )}
              <div className="max-h-64 overflow-y-auto rounded-md border">
                <ul className="divide-y">
                  {discoverModelsResult.map((model) => (
                    <li
                      key={model.id}
                      className="flex items-center justify-between gap-3 px-4 py-2"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-sm">{model.id}</span>
                        {model.ownedBy ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {model.ownedBy}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant={
                            testModelId === model.id ? "default" : "outline"
                          }
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleTestModel(model.id)}
                          disabled={testLoading}
                        >
                          Testar
                        </Button>
                        {existingModelIds.has(model.id) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              window.open(
                                `/models/${encodeURIComponent(model.id)}`,
                                "_blank",
                              );
                            }}
                          >
                            Configurar
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              void handleRegisterSingleModel(model.id);
                            }}
                            disabled={registerModelsLoading}
                          >
                            Adicionar
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {testModelId && (
                <div className="space-y-2 rounded-md border p-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium">Teste rapido</Label>
                    <span className="font-mono text-xs text-muted-foreground">
                      {testModelId}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      placeholder="Enter a test prompt..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleRunTest();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => void handleRunTest()}
                      disabled={testLoading || !testPrompt.trim()}
                    >
                      {testLoading ? "Running..." : "Run"}
                    </Button>
                  </div>
                  {testError && (
                    <p className="text-xs text-destructive">{testError}</p>
                  )}
                  {testResult && (
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs whitespace-pre-wrap">
                        {testResult}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-row gap-2">
            {discoverModelsResult.length > 0 && (
              <Button
                size="sm"
                onClick={() => {
                  void handleRegisterModels();
                }}
                disabled={
                  registerModelsLoading ||
                  discoverModelsResult.every((model) =>
                    existingModelIds.has(model.id),
                  )
                }
              >
                {registerModelsLoading ? "Registering..." : "Register All"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDiscoverModelsOpen(false);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
