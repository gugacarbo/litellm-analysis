import { z } from "zod";

export const permissionSchema = z.object({
  edit: z
    .enum(["ask", "allow", "deny"])
    .meta({ title: "Edit", description: "Permission to edit files" })
    .optional(),
  bash: z
    .union([
      z.enum(["ask", "allow", "deny"]),
      z.record(z.string(), z.enum(["ask", "allow", "deny"])),
    ])
    .meta({ title: "Bash", description: "Permission to run bash commands" })
    .optional(),
  webfetch: z
    .enum(["ask", "allow", "deny"])
    .meta({
      title: "Web Fetch",
      description: "Permission to fetch web content",
    })
    .optional(),
  doom_loop: z
    .enum(["ask", "allow", "deny"])
    .meta({
      title: "Doom Loop",
      description: "Permission for doom loop detection",
    })
    .optional(),
  external_directory: z
    .enum(["ask", "allow", "deny"])
    .meta({
      title: "External Directory",
      description: "Permission to access external directories",
    })
    .optional(),
});

export type Permission = z.infer<typeof permissionSchema>;
