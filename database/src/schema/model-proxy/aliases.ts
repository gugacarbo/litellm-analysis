import {
  integer,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { modelProxyModels } from "./models";
import { modelProxyTable } from "./table";

export const modelProxyAliases = modelProxyTable(
  "model_proxy_aliases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    alias: text("alias").notNull(),
    aliasNormalized: text("alias_normalized").notNull(),
    targetModelId: uuid("target_model_id")
      .notNull()
      .references(() => modelProxyModels.id, { onDelete: "restrict" }),
    revision: integer("revision").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_model_proxy_aliases_normalized").on(table.aliasNormalized),
  ],
);

export type ModelProxyAlias = typeof modelProxyAliases.$inferSelect;
export type NewModelProxyAlias = typeof modelProxyAliases.$inferInsert;
