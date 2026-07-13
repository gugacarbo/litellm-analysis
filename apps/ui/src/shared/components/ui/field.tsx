import type * as React from "react";

import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="field" className={cn("grid gap-2", className)} {...props} />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return <Label data-slot="field-label" className={cn(className)} {...props} />;
}

type FieldErrorProps = React.ComponentProps<"p"> & {
  errors?: Array<{ message?: string } | undefined>;
};

function FieldError({
  className,
  errors,
  children,
  ...props
}: FieldErrorProps) {
  const messages = errors
    ?.map((error) => error?.message)
    .filter((message): message is string => Boolean(message));

  if (!children && !messages?.length) return null;

  return (
    <p
      data-slot="field-error"
      role="alert"
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {children ?? messages?.join(", ")}
    </p>
  );
}

export { Field, FieldError, FieldLabel };
