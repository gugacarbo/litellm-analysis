import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const acceptInviteSchema = signInSchema.extend({
  name: z.string().trim().min(1, "Name is required."),
});

type SignInValues = z.infer<typeof signInSchema>;
type AcceptInviteValues = z.infer<typeof acceptInviteSchema>;

type LoginPageProps = Readonly<{
  inviteToken?: string;
  returnTo: string;
}>;

export function LoginPage({ returnTo, inviteToken }: LoginPageProps) {
  const [mode, setMode] = useState<"sign-in" | "accept-invite">(
    inviteToken ? "accept-invite" : "sign-in",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const acceptInviteForm = useForm<AcceptInviteValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const handleSignIn = async ({ email, password }: SignInValues) => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(result?.message ?? "Invalid credentials");
        return;
      }

      window.location.href = returnTo;
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async ({
    email,
    name,
    password,
  }: AcceptInviteValues) => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          inviteToken,
          email,
          name,
          password,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        setError(result.error?.message ?? "Failed to accept invite");
        return;
      }

      window.location.href = returnTo;
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "accept-invite") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Accept Invite
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form
              noValidate
              onSubmit={acceptInviteForm.handleSubmit(handleAcceptInvite)}
              className="mt-6 space-y-4"
            >
              <Controller
                control={acceptInviteForm.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={acceptInviteForm.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={acceptInviteForm.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Accept Invite & Sign In"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Button
                className="text-primary"
                variant="link"
                type="button"
                onClick={() => {
                  setMode("sign-in");
                  setError("");
                }}
              >
                Already have an account? Sign in
              </Button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form
            noValidate
            onSubmit={signInForm.handleSubmit(handleSignIn)}
            className="mt-6 space-y-4"
          >
            <Controller
              control={signInForm.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={signInForm.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Button
              className="text-primary"
              variant="link"
              type="button"
              onClick={() => {
                setMode("accept-invite");
                setError("");
              }}
            >
              Have an invite token? Accept invite
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
