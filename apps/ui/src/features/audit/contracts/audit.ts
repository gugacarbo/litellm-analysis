import { z } from "zod";

const textFilterSchema = z.string().min(1).max(256);
const cursorSchema = z.string().min(1);

/**
 * Public boundary shared by URL search, query functions and server functions.
 * Provenance belongs to the server-side audit context and is deliberately not
 * representable here.
 */
export const auditListInputSchema = z
  .object({
    start: z.string().datetime({ offset: true }).optional(),
    end: z.string().datetime({ offset: true }).optional(),
    actorId: textFilterSchema.optional(),
    action: textFilterSchema.optional(),
    resourceType: textFilterSchema.optional(),
    outcome: z.enum(["success", "failure", "denied"]).optional(),
    cursor: cursorSchema.optional(),
    direction: z.enum(["older", "newer"]).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.cursor === undefined) !== (value.direction === undefined)) {
      context.addIssue({
        code: "custom",
        message: "Cursor and direction must be provided together",
        path: ["cursor"],
      });
    }
    if (value.start && value.end && value.start > value.end) {
      context.addIssue({
        code: "custom",
        message: "Start must not be after end",
        path: ["start"],
      });
    }
  });

export const auditEventIdInputSchema = z
  .object({ id: z.string().uuid() })
  .strict();

export type AuditListInput = z.infer<typeof auditListInputSchema>;
export type AuditEventIdInput = z.infer<typeof auditEventIdInputSchema>;
