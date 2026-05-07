import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
export const webEnv = createEnv({
  server: {},
  clientPrefix: "VITE_",
  client: {
    VITE_APP_LOCALE: z.string().trim().optional(),
    VITE_APP_TIMEZONE: z.string().trim().optional(),
    VITE_DEBUG_LOCALE: z.string().trim().optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
