import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
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
} from "../server/application-secrets.functions";

const secretDefinitions: ReadonlyArray<{
  key: ApplicationSecretKey;
  name: string;
}> = [
  { key: "artificial_analysis_api_key", name: "Artificial Analysis" },
  { key: "openrouter_api_key", name: "OpenRouter" },
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

export function SecretsPage() {
  const queryClient = useQueryClient();
  const secretsQuery = useQuery(modelAdminQueries.applicationSecrets());
  const providersQuery = useQuery(modelAdminQueries.providers());
  const [editing, setEditing] = useState<ApplicationSecretKey | null>(null);
  const [removeCandidate, setRemoveCandidate] =
    useState<ApplicationSecretKey | null>(null);
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
            <Card key={definition.key}>
              <CardContent className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex min-w-44 flex-1 items-center gap-2">
                  <CardTitle className="text-base">{definition.name}</CardTitle>
                  <span className="truncate text-muted-foreground text-xs">
                    {secret.updatedAt
                      ? `Updated ${secret.updatedAt.toLocaleString()}`
                      : "No key has been stored."}
                  </span>
                </div>
                <Badge variant={secret.isConfigured ? "default" : "outline"}>
                  {secret.isConfigured ? "Configured" : "Not configured"}
                </Badge>
                {isEditing ? (
                  <form
                    className="flex min-w-full flex-wrap items-start gap-2"
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
                      type="password"
                      {...form.register("value")}
                    />
                    {form.formState.errors.value?.message ? (
                      <p className="text-destructive text-sm">
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
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        setFeedback(null);
                        form.reset({ key: definition.key, value: "" });
                        setEditing(definition.key);
                      }}
                      type="button"
                    >
                      {secret.isConfigured ? "Replace key" : "Set key"}
                    </Button>
                    {secret.isConfigured ? (
                      <Button
                        disabled={removeMutation.isPending}
                        onClick={() => setRemoveCandidate(definition.key)}
                        type="button"
                        variant="destructive"
                      >
                        Remove key
                      </Button>
                    ) : null}
                  </div>
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
            {(providersQuery.data as ProviderPublic[]).map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                    {provider.name}
                    <Badge
                      variant={
                        provider.credentialStatus === "configured"
                          ? "default"
                          : "outline"
                      }
                    >
                      {provider.credentialStatus === "configured"
                        ? "Configured"
                        : "No credential"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {provider.provider ?? "Adapter not informed"} ·{" "}
                    {provider.baseUrl ?? "No base URL"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-1 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Credential</dt>
                      <dd>
                        {provider.credentialStatus === "configured"
                          ? "Stored securely"
                          : "Not configured"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Last updated</dt>
                      <dd>{provider.updatedAt.toLocaleString()}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
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
