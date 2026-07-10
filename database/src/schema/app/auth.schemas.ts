import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

import { account, appInvites, session, user, verification } from "./auth";

export const userSelectSchema = createSelectSchema(user);
export const userInsertSchema = createInsertSchema(user);
export const userUpdateSchema = createUpdateSchema(user);

export const sessionSelectSchema = createSelectSchema(session);
export const sessionInsertSchema = createInsertSchema(session);
export const sessionUpdateSchema = createUpdateSchema(session);

export const accountSelectSchema = createSelectSchema(account);
export const accountInsertSchema = createInsertSchema(account);
export const accountUpdateSchema = createUpdateSchema(account);

export const verificationSelectSchema = createSelectSchema(verification);
export const verificationInsertSchema = createInsertSchema(verification);
export const verificationUpdateSchema = createUpdateSchema(verification);

export const appInviteSelectSchema = createSelectSchema(appInvites);
export const appInviteInsertSchema = createInsertSchema(appInvites);
export const appInviteUpdateSchema = createUpdateSchema(appInvites);
