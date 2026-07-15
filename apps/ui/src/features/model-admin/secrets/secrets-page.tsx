import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/features/app-shell/components/page-header";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import type {
  ApplicationSecretKey,
  ApplicationSecretPublic,
  ProviderPublic,
  ReplaceApplicationSecretInput,
} from "../contracts/model-admin";
import { replaceApplicationSecretInputSchema } from "../contracts/model-admin";
import {
  invalidateModelAdmin,
  modelAdminQueries,
} from "../query/query-options";
import {
  removeApplicationSecret,
  replaceApplicationSecret,
  testApplicationSecret,
} from "../server/application-secrets.functions";
import { testProvider, updateProvider } from "../server/model-admin.functions";

const secretDefinitions: ReadonlyArray<{
  apiUrl: string;
  key: ApplicationSecretKey;
  name: string;
}> = [
  {
    apiUrl: "https://artificialanalysis.ai/api/v2",
    key: "artificial_analysis_api_key",
    name: "Artificial Analysis",
  },
  {
    apiUrl: "https://openrouter.ai/api/v1",
    key: "openrouter_api_key",
    name: "OpenRouter",
  },
];

function toErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return "The secret could not be updated. Try again.";
}

function requireSuccess<T>(
  result: { ok: true; data: T } | { ok: false; error: unknown },
): T {
  if (result.ok) return result.data;
  throw result.error;
}

type TestDialogState = {
  status: "running" | "success" | "error";
  title: string;
  message: string;
};

export function SecretsPage() {
  const queryClient = useQueryClient();
  const secretsQuery = useQuery(modelAdminQueries.applicationSecrets());
  const providersQuery = useQuery(modelAdminQueries.providers());
  const [editing, setEditing] = useState<ApplicationSecretKey | null>(null);
  const [removeCandidate, setRemoveCandidate] =
    useState<ApplicationSecretKey | null>(null);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(
    null,
  );
  const [providerCredentialValue, setProviderCredentialValue] = useState("");
  const [testDialog, setTestDialog] = useState<TestDialogState | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const form = useForm<ReplaceApplicationSecretInput>({
    resolver: zodResolver(replaceApplicationSecretInputSchema),
    defaultValues: { key: "artificial_analysis_api_key", value: "" },
  });

  const replaceMutation = useMutation({
    mutationFn: async (input: ReplaceApplicationSecretInput) =>
      requireSuccess(await replaceApplicationSecret({ data: input })),
    onSuccess: async () => {
      await invalidateModelAdmin.applicationSecrets(queryClient);
      form.reset();
      setEditing(null);
      setFeedback("Secret saved.");
    },
    onError: (error) => setFeedback(toErrorMessage(error)),
  });
  const removeMutation = useMutation({
    mutationFn: async (key: ApplicationSecretKey) =>
      requireSuccess(await removeApplicationSecret({ data: { key } })),
    onSuccess: async () => {
      await invalidateModelAdmin.applicationSecrets(queryClient);
      setFeedback("Secret removed.");
    },
    onError: (error) => setFeedback(toErrorMessage(error)),
  });
  const testApplicationSecretMutation = useMutation({
    mutationFn: async (key: ApplicationSecretKey) =>
      requireSuccess(await testApplicationSecret({ data: { key } })),
    onSuccess: () => {
      setTestDialog((current) =>
        current
          ? {
              ...current,
              message: "Connection successful.",
              status: "success",
            }
          : null,
      );
    },
    onError: (error) => {
      setTestDialog((current) =>
        current
          ? { ...current, message: toErrorMessage(error), status: "error" }
          : null,
      );
    },
  });
  const testProviderMutation = useMutation({
    mutationFn: async (provider: ProviderPublic) =>
      requireSuccess(await testProvider({ data: { id: provider.id } })),
    onSuccess: () => {
      setTestDialog((current) =>
        current
          ? {
              ...current,
              message: "Connection successful.",
              status: "success",
            }
          : null,
      );
    },
    onError: (error) => {
      setTestDialog((current) =>
        current
          ? { ...current, message: toErrorMessage(error), status: "error" }
          : null,
      );
    },
  });
  const updateProviderMutation = useMutation({
    mutationFn: async (input: { provider: ProviderPublic; value: string }) =>
      requireSuccess(
        await updateProvider({
          data: {
            id: input.provider.id,
            expectedRevision: input.provider.revision,
            credential: { kind: "replace", value: input.value },
          },
        }),
      ),
    onSuccess: async (_, input) => {
      await invalidateModelAdmin.provider(queryClient, input.provider.id);
      setEditingProviderId(null);
      setProviderCredentialValue("");
      setFeedback("Provider key updated.");
    },
    onError: (error) => {
      setProviderCredentialValue("");
      setFeedback(toErrorMessage(error));
    },
  });

  if (secretsQuery.isLoading) {
    return <section className="p-8">Loading application secrets…</section>;
  }
  if (secretsQuery.isError) {
    return (
      <section className="space-y-4 p-8">
        <Alert variant="destructive">
          <AlertDescription>{secretsQuery.error.message}</AlertDescription>
        </Alert>
        <Button onClick={() => void secretsQuery.refetch()}>Try again</Button>
      </section>
    );
  }

  const byKey = new Map(
    (secretsQuery.data ?? []).map((secret) => [secret.key, secret]),
  );

  return (
    <section className="space-y-6">
      <PageHeader
        title="Application secrets"
        subtitle="Configure provider keys without exposing their values after save."
      />

      {feedback ? (
        <Alert>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4">
        {secretDefinitions.map((definition) => {
          const secret: ApplicationSecretPublic = byKey.get(definition.key) ?? {
            key: definition.key,
            isConfigured: false,
            createdAt: null,
            updatedAt: null,
          };
          const isEditing = editing === definition.key;

          return (
            <Card
              className="[--card-spacing:--spacing(3)]"
              key={definition.key}
            >
              <CardContent className="flex flex-wrap items-center gap-3">
                {isEditing ? (
                  <form
                    className="flex w-full flex-wrap items-center gap-2"
                    noValidate
                    onSubmit={form.handleSubmit((input) => {
                      setFeedback(null);
                      replaceMutation.mutate(input);
                    })}
                  >
                    <Input
                      aria-label={`API key for ${definition.name}`}
                      autoComplete="off"
                      aria-invalid={Boolean(form.formState.errors.value)}
                      className="min-w-48 flex-1"
                      placeholder="Enter API key"
                      type="password"
                      {...form.register("value")}
                    />
                    {form.formState.errors.value?.message ? (
                      <p className="w-full text-destructive text-sm">
                        {form.formState.errors.value.message}
                      </p>
                    ) : null}
                    <div className="flex gap-2">
                      <Button
                        disabled={replaceMutation.isPending}
                        type="submit"
                      >
                        Save key
                      </Button>
                      <Button
                        onClick={() => {
                          setEditing(null);
                          form.reset();
                        }}
                        type="button"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="min-w-44 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {definition.name}
                        </CardTitle>
                        <Badge
                          variant={secret.isConfigured ? "default" : "outline"}
                        >
                          {secret.isConfigured
                            ? "Configured"
                            : "Not configured"}
                        </Badge>
                      </div>
                      <span className="block truncate text-muted-foreground text-xs">
                        {definition.apiUrl}
                      </span>
                      <span className="block text-muted-foreground text-xs">
                        {secret.updatedAt
                          ? `Updated ${secret.updatedAt.toLocaleString()}`
                          : "No key has been stored."}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            aria-label={`Actions for ${definition.name}`}
                            size="icon"
                            type="button"
                            variant="outline"
                          >
                            <MoreHorizontal />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={testApplicationSecretMutation.isPending}
                          onClick={() => {
                            setFeedback(null);
                            setTestDialog({
                              message: "Testing connection…",
                              status: "running",
                              title: definition.name,
                            });
                            testApplicationSecretMutation.mutate(
                              definition.key,
                            );
                          }}
                        >
                          Test
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setFeedback(null);
                            form.reset({ key: definition.key, value: "" });
                            setEditing(definition.key);
                          }}
                        >
                          {secret.isConfigured ? "Replace key" : "Set key"}
                        </DropdownMenuItem>
                        {secret.isConfigured ? (
                          <DropdownMenuItem
                            disabled={removeMutation.isPending}
                            onClick={() => setRemoveCandidate(definition.key)}
                            variant="destructive"
                          >
                            Remove key
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <section
        aria-labelledby="provider-credentials-heading"
        className="space-y-4"
      >
        <div>
          <h2
            className="font-heading font-semibold text-xl"
            id="provider-credentials-heading"
          >
            Provider credentials
          </h2>
          <p className="text-muted-foreground text-sm">
            Configured provider credentials are listed here without exposing
            their values.
          </p>
        </div>
        {providersQuery.isLoading ? (
          <Card>
            <CardContent className="pt-6 text-muted-foreground text-sm">
              Loading provider credentials…
            </CardContent>
          </Card>
        ) : providersQuery.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Could not load provider credentials:{" "}
              {providersQuery.error.message}
            </AlertDescription>
          </Alert>
        ) : ((providersQuery.data as ProviderPublic[]) ?? []).length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-muted-foreground text-sm">
              No providers configured yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {(providersQuery.data as ProviderPublic[]).map((provider) => {
              const isEditingProvider = editingProviderId === provider.id;
              const hasCredential = provider.credentialStatus === "configured";

              return (
                <Card
                  className="[--card-spacing:--spacing(3)]"
                  key={provider.id}
                >
                  <CardContent className="flex flex-wrap items-center gap-3">
                    <div className="min-w-52 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {provider.name}
                        </CardTitle>
                        <Badge variant={hasCredential ? "default" : "outline"}>
                          {hasCredential ? "Configured" : "No credential"}
                        </Badge>
                      </div>
                      <CardDescription className="truncate text-xs">
                        {provider.baseUrl ?? "No base URL"}
                      </CardDescription>
                      <span className="text-muted-foreground text-xs">
                        Updated {provider.updatedAt.toLocaleString()}
                      </span>
                    </div>
                    {isEditingProvider ? (
                      <form
                        className="flex min-w-full flex-wrap items-center gap-2"
                        noValidate
                        onSubmit={(event) => {
                          event.preventDefault();
                          const value = providerCredentialValue.trim();
                          if (!value) {
                            setFeedback("Enter a provider key.");
                            return;
                          }
                          setFeedback(null);
                          updateProviderMutation.mutate({ provider, value });
                        }}
                      >
                        <Input
                          aria-label={`API key for ${provider.name}`}
                          autoComplete="new-password"
                          className="min-w-52 flex-1"
                          onChange={(event) =>
                            setProviderCredentialValue(event.target.value)
                          }
                          placeholder="Enter API key"
                          type="password"
                          value={providerCredentialValue}
                        />
                        <div className="flex gap-2">
                          <Button
                            disabled={updateProviderMutation.isPending}
                            type="submit"
                          >
                            Save key
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingProviderId(null);
                              setProviderCredentialValue("");
                            }}
                            type="button"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              aria-label={`Actions for ${provider.name}`}
                              size="icon"
                              type="button"
                              variant="outline"
                            >
                              <MoreHorizontal />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={testProviderMutation.isPending}
                            onClick={() => {
                              setFeedback(null);
                              setTestDialog({
                                message: "Testing connection…",
                                status: "running",
                                title: provider.name,
                              });
                              testProviderMutation.mutate(provider);
                            }}
                          >
                            Test
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setFeedback(null);
                              setProviderCredentialValue("");
                              setEditingProviderId(provider.id);
                            }}
                          >
                            {hasCredential ? "Update key" : "Add key"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
      <Dialog
        open={testDialog !== null}
        onOpenChange={(open) => {
          if (
            !open &&
            !testApplicationSecretMutation.isPending &&
            !testProviderMutation.isPending
          ) {
            setTestDialog(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={
            !testApplicationSecretMutation.isPending &&
            !testProviderMutation.isPending
          }
        >
          <DialogHeader>
            <DialogTitle>Test {testDialog?.title}</DialogTitle>
            <DialogDescription>
              The credential is tested securely on the server.
            </DialogDescription>
          </DialogHeader>
          <div
            aria-live="polite"
            className={
              testDialog?.status === "error"
                ? "text-destructive"
                : "text-muted-foreground"
            }
            role="status"
          >
            {testDialog?.message}
          </div>
          {testDialog?.status !== "running" ? (
            <DialogFooter showCloseButton />
          ) : null}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={removeCandidate !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove stored key?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The next sync will require a new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removeCandidate) return;
                setFeedback(null);
                removeMutation.mutate(removeCandidate);
                setRemoveCandidate(null);
              }}
            >
              Remove key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
