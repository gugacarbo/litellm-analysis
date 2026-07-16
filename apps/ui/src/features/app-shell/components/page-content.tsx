import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";

type PageContentProps = ComponentProps<"section">;

/** Standard vertical rhythm for application pages and their primary content. */
export function PageContent({ className, ...props }: PageContentProps) {
  return <section className={cn("space-y-4", className)} {...props} />;
}
