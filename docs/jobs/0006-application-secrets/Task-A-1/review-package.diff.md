# Review package

- Task: Task-A-1
- Base commit: c22e434a3fb31b00a29c961681a23d3575343115
- Head: HEAD (c22e434a3fb31b00a29c961681a23d3575343115; task changes are intentionally uncommitted during this execution phase)
- Source: working-tree diff against the recorded base, including untracked task files

## Full diff

```diff
diff --git a/database/drizzle/meta/_journal.json b/database/drizzle/meta/_journal.json
index 81f99e33..40fe5471 100644
--- a/database/drizzle/meta/_journal.json
+++ b/database/drizzle/meta/_journal.json
@@ -22,6 +22,13 @@
       "when": 1783727087377,
       "tag": "0002_sour_firebrand",
       "breakpoints": true
+    },
+    {
+      "idx": 3,
+      "version": "7",
+      "when": 1784076943644,
+      "tag": "0003_application-secrets-store",
+      "breakpoints": true
     }
   ]
-}
+}
\ No newline at end of file
diff --git a/database/src/schema/index.ts b/database/src/schema/index.ts
index 0dffb169..ecce697e 100644
--- a/database/src/schema/index.ts
+++ b/database/src/schema/index.ts
@@ -1,2 +1,7 @@
 export * from "./app/index";
+export {
+  type ApplicationSecret,
+  applicationSecretsStore,
+  type NewApplicationSecret,
+} from "./application-secrets";
 export * from "./model-proxy/index";
diff --git a/database/src/schema/model-proxy/schema-contract.test.ts b/database/src/schema/model-proxy/schema-contract.test.ts
index 27260bdb..548558cc 100644
--- a/database/src/schema/model-proxy/schema-contract.test.ts
+++ b/database/src/schema/model-proxy/schema-contract.test.ts
@@ -1,5 +1,6 @@
 import { getTableConfig } from "drizzle-orm/pg-core";
 import { describe, expect, it } from "vitest";
+import { applicationSecretsStore } from "../application-secrets";
 import { modelProxyAliases } from "./aliases";
 import { modelProxyModels } from "./models";
 import { modelProxyProviders } from "./providers";
@@ -11,6 +12,27 @@ function findIndex(table: Parameters<typeof getTableConfig>[0], name: string) {
 }

 describe("model proxy clean-cut schema", () => {
+  it("stores application secrets under a unique key with a required encrypted envelope", () => {
+    const keyIndex = findIndex(
+      applicationSecretsStore,
+      "uq_application_secrets_store_key",
+    );
+
+    expect(applicationSecretsStore.key.notNull).toBe(true);
+    expect(applicationSecretsStore.credentialEnvelope.notNull).toBe(true);
+    expect(keyIndex?.config.unique).toBe(true);
+    expect(
+      keyIndex?.config.columns.map(
+        (column) => (column as { name?: string }).name,
+      ),
+    ).toEqual(["key"]);
+    expect(
+      getTableConfig(applicationSecretsStore).checks.map(
+        (constraint) => constraint.name,
+      ),
+    ).toContain("ck_application_secrets_store_key_allowlist");
+  });
+
   it("requires a provider and prevents duplicate model ids inside one provider", () => {
     const providerForeignKey = getTableConfig(
       modelProxyModels,
diff --git a/services/llm-config-service/src/factory.ts b/services/llm-config-service/src/factory.ts
index 0c6e8a3b..8db5f76b 100644
--- a/services/llm-config-service/src/factory.ts
+++ b/services/llm-config-service/src/factory.ts
@@ -3,6 +3,10 @@ import {
   ApiKeysService,
   type IApiKeysService,
 } from "./services/api-keys.service.js";
+import {
+  ApplicationSecretsService,
+  type IApplicationSecretsService,
+} from "./services/application-secrets.service.js";
 import {
   type IOpenAiOAuthService,
   OpenAiOAuthService,
@@ -21,6 +25,7 @@ export interface RegistryServices {
   settingsService: ISettingsService;
   registryModelsService: IRegistryModelsService;
   apiKeysService: IApiKeysService;
+  applicationSecretsService: IApplicationSecretsService;
   openAiOAuthService: IOpenAiOAuthService;
 }

@@ -38,6 +43,7 @@ export function createRegistryServices(
     settingsService: new SettingsService({ db }),
     registryModelsService: new RegistryModelsService({ db }),
     apiKeysService: new ApiKeysService({ db }),
+    applicationSecretsService: new ApplicationSecretsService({ db }),
     openAiOAuthService: new OpenAiOAuthService({ db }),
   };
 }
diff --git a/services/llm-config-service/src/index.ts b/services/llm-config-service/src/index.ts
index 4ce96b4b..ae65e723 100644
--- a/services/llm-config-service/src/index.ts
+++ b/services/llm-config-service/src/index.ts
@@ -23,6 +23,13 @@ export {
   parseProviderEncryptionKey,
   resolveProviderCredential,
 } from "./lib/provider-secrets.js";
+export {
+  APPLICATION_SECRET_KEYS,
+  type ApplicationSecretKey,
+  type ApplicationSecretRecord,
+  ApplicationSecretsRepository,
+  type ApplicationSecretsRepositoryPort,
+} from "./repositories/application-secrets-repository.js";
 export { ModelsRepository } from "./repositories/models-repository.js";
 export { SettingsRepository } from "./repositories/settings-repository.js";
 export {
@@ -30,6 +37,12 @@ export {
   type ApiKeysServiceOptions,
   type IApiKeysService,
 } from "./services/api-keys.service.js";
+export {
+  type ApplicationSecretPublic,
+  ApplicationSecretsService,
+  type ApplicationSecretsServiceOptions,
+  type IApplicationSecretsService,
+} from "./services/application-secrets.service.js";
 export {
   ModelAdminService,
   type ModelAdminServiceOptions,

diff --git a/database/drizzle/0003_application-secrets-store.sql b/database/drizzle/0003_application-secrets-store.sql
new file mode 100644
index 00000000..8f7c0ee8
--- /dev/null
+++ b/database/drizzle/0003_application-secrets-store.sql
@@ -0,0 +1,10 @@
+CREATE TABLE "application_secrets_store" (
+	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
+	"key" text NOT NULL,
+	"credential_envelope" text NOT NULL,
+	"created_at" timestamp DEFAULT now() NOT NULL,
+	"updated_at" timestamp DEFAULT now() NOT NULL,
+	CONSTRAINT "ck_application_secrets_store_key_allowlist" CHECK ("application_secrets_store"."key" IN ('artificial_analysis_api_key', 'openrouter_api_key'))
+);
+--> statement-breakpoint
+CREATE UNIQUE INDEX "uq_application_secrets_store_key" ON "application_secrets_store" USING btree ("key");
\ No newline at end of file

diff --git a/database/drizzle/meta/0003_snapshot.json b/database/drizzle/meta/0003_snapshot.json
new file mode 100644
index 00000000..87edfa12
--- /dev/null
+++ b/database/drizzle/meta/0003_snapshot.json
@@ -0,0 +1,2111 @@
+{
+  "id": "c4207070-1228-4a3d-8b92-d9e951c6a393",
+  "prevId": "50c9ad7e-73f4-461c-a295-abc6ca8b4968",
+  "version": "7",
+  "dialect": "postgresql",
+  "tables": {
+    "public.application_secrets_store": {
+      "name": "application_secrets_store",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "key": {
+          "name": "key",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "credential_envelope": {
+          "name": "credential_envelope",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "uq_application_secrets_store_key": {
+          "name": "uq_application_secrets_store_key",
+          "columns": [
+            {
+              "expression": "key",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {
+        "ck_application_secrets_store_key_allowlist": {
+          "name": "ck_application_secrets_store_key_allowlist",
+          "value": "\"application_secrets_store\".\"key\" IN ('artificial_analysis_api_key', 'openrouter_api_key')"
+        }
+      },
+      "isRLSEnabled": false
+    },
+    "public.account": {
+      "name": "account",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "account_id": {
+          "name": "account_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "provider_id": {
+          "name": "provider_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "user_id": {
+          "name": "user_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "access_token": {
+          "name": "access_token",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "refresh_token": {
+          "name": "refresh_token",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "id_token": {
+          "name": "id_token",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "access_token_expires_at": {
+          "name": "access_token_expires_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "refresh_token_expires_at": {
+          "name": "refresh_token_expires_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "scope": {
+          "name": "scope",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "password": {
+          "name": "password",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "account_user_id_idx": {
+          "name": "account_user_id_idx",
+          "columns": [
+            {
+              "expression": "user_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "account_user_id_user_id_fk": {
+          "name": "account_user_id_user_id_fk",
+          "tableFrom": "account",
+          "tableTo": "user",
+          "columnsFrom": [
+            "user_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.alerts": {
+      "name": "alerts",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "serial",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "anomaly_type": {
+          "name": "anomaly_type",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "model": {
+          "name": "model",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "severity": {
+          "name": "severity",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "message": {
+          "name": "message",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "metadata": {
+          "name": "metadata",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "detected_at": {
+          "name": "detected_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "acknowledged_at": {
+          "name": "acknowledged_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.app_invite": {
+      "name": "app_invite",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "email": {
+          "name": "email",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "token_hash": {
+          "name": "token_hash",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "role": {
+          "name": "role",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'viewer'"
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "used_at": {
+          "name": "used_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "created_by_user_id": {
+          "name": "created_by_user_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        }
+      },
+      "indexes": {
+        "app_invite_token_hash_idx": {
+          "name": "app_invite_token_hash_idx",
+          "columns": [
+            {
+              "expression": "token_hash",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "app_invite_email_idx": {
+          "name": "app_invite_email_idx",
+          "columns": [
+            {
+              "expression": "email",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "app_invite_created_by_user_id_user_id_fk": {
+          "name": "app_invite_created_by_user_id_user_id_fk",
+          "tableFrom": "app_invite",
+          "tableTo": "user",
+          "columnsFrom": [
+            "created_by_user_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "set null",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_health_checks": {
+      "name": "model_health_checks",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "serial",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "model_name": {
+          "name": "model_name",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "response_time_ms": {
+          "name": "response_time_ms",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "ttft_ms": {
+          "name": "ttft_ms",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "output_tokens": {
+          "name": "output_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "tokens_per_second": {
+          "name": "tokens_per_second",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "status_code": {
+          "name": "status_code",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "prompt_sent": {
+          "name": "prompt_sent",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "response_received": {
+          "name": "response_received",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "request_payload": {
+          "name": "request_payload",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "response_payload": {
+          "name": "response_payload",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "error_message": {
+          "name": "error_message",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "source": {
+          "name": "source",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'scheduled'"
+        },
+        "checked_at": {
+          "name": "checked_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.session": {
+      "name": "session",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "token": {
+          "name": "token",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "ip_address": {
+          "name": "ip_address",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "user_agent": {
+          "name": "user_agent",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "user_id": {
+          "name": "user_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "session_token_idx": {
+          "name": "session_token_idx",
+          "columns": [
+            {
+              "expression": "token",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "session_user_id_idx": {
+          "name": "session_user_id_idx",
+          "columns": [
+            {
+              "expression": "user_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "session_user_id_user_id_fk": {
+          "name": "session_user_id_user_id_fk",
+          "tableFrom": "session",
+          "tableTo": "user",
+          "columnsFrom": [
+            "user_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.user": {
+      "name": "user",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "name": {
+          "name": "name",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "email": {
+          "name": "email",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "email_verified": {
+          "name": "email_verified",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "image": {
+          "name": "image",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "role": {
+          "name": "role",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'viewer'"
+        },
+        "banned": {
+          "name": "banned",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "ban_reason": {
+          "name": "ban_reason",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "ban_expires": {
+          "name": "ban_expires",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "user_email_idx": {
+          "name": "user_email_idx",
+          "columns": [
+            {
+              "expression": "email",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.verification": {
+      "name": "verification",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "identifier": {
+          "name": "identifier",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "value": {
+          "name": "value",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "verification_identifier_idx": {
+          "name": "verification_identifier_idx",
+          "columns": [
+            {
+              "expression": "identifier",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_aliases": {
+      "name": "model_proxy_aliases",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "alias": {
+          "name": "alias",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "alias_normalized": {
+          "name": "alias_normalized",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "target_model_id": {
+          "name": "target_model_id",
+          "type": "uuid",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "revision": {
+          "name": "revision",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 1
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "uq_model_proxy_aliases_normalized": {
+          "name": "uq_model_proxy_aliases_normalized",
+          "columns": [
+            {
+              "expression": "alias_normalized",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "model_proxy_aliases_target_model_id_model_proxy_models_id_fk": {
+          "name": "model_proxy_aliases_target_model_id_model_proxy_models_id_fk",
+          "tableFrom": "model_proxy_aliases",
+          "tableTo": "model_proxy_models",
+          "columnsFrom": [
+            "target_model_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_api_keys": {
+      "name": "model_proxy_api_keys",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "label": {
+          "name": "label",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "key_hash": {
+          "name": "key_hash",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "enabled": {
+          "name": "enabled",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": true
+        },
+        "last_used_at": {
+          "name": "last_used_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "idx_api_keys_enabled_label": {
+          "name": "idx_api_keys_enabled_label",
+          "columns": [
+            {
+              "expression": "enabled",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "label",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "model_proxy_api_keys_key_hash_unique": {
+          "name": "model_proxy_api_keys_key_hash_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "key_hash"
+          ]
+        }
+      },
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_benchmarks": {
+      "name": "model_proxy_benchmarks",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "aa_model_id": {
+          "name": "aa_model_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source": {
+          "name": "source",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "name": {
+          "name": "name",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "slug": {
+          "name": "slug",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "creator_id": {
+          "name": "creator_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "creator_name": {
+          "name": "creator_name",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "creator_slug": {
+          "name": "creator_slug",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "intelligence_index": {
+          "name": "intelligence_index",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "coding_index": {
+          "name": "coding_index",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "math_index": {
+          "name": "math_index",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "mmlu_pro": {
+          "name": "mmlu_pro",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "gpqa": {
+          "name": "gpqa",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "hle": {
+          "name": "hle",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "livecodebench": {
+          "name": "livecodebench",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "scicode": {
+          "name": "scicode",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "math_500": {
+          "name": "math_500",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "aime": {
+          "name": "aime",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "aime_25": {
+          "name": "aime_25",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "tau2": {
+          "name": "tau2",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "ifbench": {
+          "name": "ifbench",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lcr": {
+          "name": "lcr",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "terminalbench_hard": {
+          "name": "terminalbench_hard",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "price_input_1m_tokens": {
+          "name": "price_input_1m_tokens",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "price_output_1m_tokens": {
+          "name": "price_output_1m_tokens",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "price_blended_1m_tokens": {
+          "name": "price_blended_1m_tokens",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "median_output_tokens_per_second": {
+          "name": "median_output_tokens_per_second",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "median_ttft_seconds": {
+          "name": "median_ttft_seconds",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "median_ttft_answer_seconds": {
+          "name": "median_ttft_answer_seconds",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "source_url": {
+          "name": "source_url",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "fetched_at": {
+          "name": "fetched_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "uq_model_proxy_benchmarks_aa_model_id_source": {
+          "name": "uq_model_proxy_benchmarks_aa_model_id_source",
+          "columns": [
+            {
+              "expression": "aa_model_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "source",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_messages": {
+      "name": "model_proxy_messages",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "request_id": {
+          "name": "request_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "role": {
+          "name": "role",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "content": {
+          "name": "content",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "idx_messages_request_created": {
+          "name": "idx_messages_request_created",
+          "columns": [
+            {
+              "expression": "request_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "created_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "model_proxy_messages_request_id_model_proxy_requests_id_fk": {
+          "name": "model_proxy_messages_request_id_model_proxy_requests_id_fk",
+          "tableFrom": "model_proxy_messages",
+          "tableTo": "model_proxy_requests",
+          "columnsFrom": [
+            "request_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_models": {
+      "name": "model_proxy_models",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "model_id": {
+          "name": "model_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "revision": {
+          "name": "revision",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 1
+        },
+        "enabled": {
+          "name": "enabled",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": true
+        },
+        "display_name": {
+          "name": "display_name",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "family": {
+          "name": "family",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "canonical_slug": {
+          "name": "canonical_slug",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "description": {
+          "name": "description",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "context_length": {
+          "name": "context_length",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "max_completion_tokens": {
+          "name": "max_completion_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "knowledge_cutoff": {
+          "name": "knowledge_cutoff",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "expiration_date": {
+          "name": "expiration_date",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "architecture": {
+          "name": "architecture",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reasoning": {
+          "name": "reasoning",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "supported_parameters": {
+          "name": "supported_parameters",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "default_parameters": {
+          "name": "default_parameters",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "per_request_limits": {
+          "name": "per_request_limits",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "pricing": {
+          "name": "pricing",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "request_options": {
+          "name": "request_options",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_id": {
+          "name": "provider_id",
+          "type": "uuid",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reasoning_api_id": {
+          "name": "reasoning_api_id",
+          "type": "uuid",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "uq_model_proxy_models_provider_model": {
+          "name": "uq_model_proxy_models_provider_model",
+          "columns": [
+            {
+              "expression": "provider_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "model_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "idx_model_proxy_models_enabled_id": {
+          "name": "idx_model_proxy_models_enabled_id",
+          "columns": [
+            {
+              "expression": "enabled",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "model_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "model_proxy_models_provider_id_model_proxy_providers_id_fk": {
+          "name": "model_proxy_models_provider_id_model_proxy_providers_id_fk",
+          "tableFrom": "model_proxy_models",
+          "tableTo": "model_proxy_providers",
+          "columnsFrom": [
+            "provider_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "model_proxy_models_reasoning_api_id_model_proxy_reasoning_apis_id_fk": {
+          "name": "model_proxy_models_reasoning_api_id_model_proxy_reasoning_apis_id_fk",
+          "tableFrom": "model_proxy_models",
+          "tableTo": "model_proxy_reasoning_apis",
+          "columnsFrom": [
+            "reasoning_api_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "set null",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_providers": {
+      "name": "model_proxy_providers",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "name": {
+          "name": "name",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "is_default": {
+          "name": "is_default",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "provider": {
+          "name": "provider",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "base_url": {
+          "name": "base_url",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "credential_envelope": {
+          "name": "credential_envelope",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "revision": {
+          "name": "revision",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 1
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "uq_model_proxy_providers_single_default": {
+          "name": "uq_model_proxy_providers_single_default",
+          "columns": [
+            {
+              "expression": "is_default",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "where": "\"model_proxy_providers\".\"is_default\" = true",
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "model_proxy_providers_name_unique": {
+          "name": "model_proxy_providers_name_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "name"
+          ]
+        }
+      },
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_reasoning_apis": {
+      "name": "model_proxy_reasoning_apis",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "slug": {
+          "name": "slug",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "provider_id": {
+          "name": "provider_id",
+          "type": "uuid",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "request_params": {
+          "name": "request_params",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "request_shape": {
+          "name": "request_shape",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "description": {
+          "name": "description",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "model_proxy_reasoning_apis_provider_id_model_proxy_providers_id_fk": {
+          "name": "model_proxy_reasoning_apis_provider_id_model_proxy_providers_id_fk",
+          "tableFrom": "model_proxy_reasoning_apis",
+          "tableTo": "model_proxy_providers",
+          "columnsFrom": [
+            "provider_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "model_proxy_reasoning_apis_slug_unique": {
+          "name": "model_proxy_reasoning_apis_slug_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "slug"
+          ]
+        }
+      },
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_requests": {
+      "name": "model_proxy_requests",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "upstream_request_id": {
+          "name": "upstream_request_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "model": {
+          "name": "model",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "upstream_model": {
+          "name": "upstream_model",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "upstream_base_url": {
+          "name": "upstream_base_url",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "started_at": {
+          "name": "started_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "finished_at": {
+          "name": "finished_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "latency_ms": {
+          "name": "latency_ms",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "ttft_ms": {
+          "name": "ttft_ms",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "input_tokens": {
+          "name": "input_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "output_tokens": {
+          "name": "output_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "total_tokens": {
+          "name": "total_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "cached_tokens": {
+          "name": "cached_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reasoning_tokens": {
+          "name": "reasoning_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "usage_estimated": {
+          "name": "usage_estimated",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "input_cost_per_token": {
+          "name": "input_cost_per_token",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "output_cost_per_token": {
+          "name": "output_cost_per_token",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "input_cost": {
+          "name": "input_cost",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "output_cost": {
+          "name": "output_cost",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "total_cost": {
+          "name": "total_cost",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "cost_estimated": {
+          "name": "cost_estimated",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "estimated_cost_usd": {
+          "name": "estimated_cost_usd",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "error_summary": {
+          "name": "error_summary",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "error_type": {
+          "name": "error_type",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "error_message": {
+          "name": "error_message",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "error_status_code": {
+          "name": "error_status_code",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "error_details": {
+          "name": "error_details",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "request_body": {
+          "name": "request_body",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "response_body": {
+          "name": "response_body",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "response_headers": {
+          "name": "response_headers",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "api_key_alias": {
+          "name": "api_key_alias",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "end_user": {
+          "name": "end_user",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        }
+      },
+      "indexes": {
+        "idx_model_proxy_requests_model_started_at": {
+          "name": "idx_model_proxy_requests_model_started_at",
+          "columns": [
+            {
+              "expression": "model",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "started_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "idx_model_proxy_requests_status_started_at": {
+          "name": "idx_model_proxy_requests_status_started_at",
+          "columns": [
+            {
+              "expression": "status",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "started_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "idx_model_proxy_requests_apikey_started_at": {
+          "name": "idx_model_proxy_requests_apikey_started_at",
+          "columns": [
+            {
+              "expression": "api_key_alias",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "started_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "idx_model_proxy_requests_enduser_started_at": {
+          "name": "idx_model_proxy_requests_enduser_started_at",
+          "columns": [
+            {
+              "expression": "end_user",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "started_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_settings": {
+      "name": "model_proxy_settings",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "key": {
+          "name": "key",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "value": {
+          "name": "value",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "model_proxy_settings_key_unique": {
+          "name": "model_proxy_settings_key_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "key"
+          ]
+        }
+      },
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_usage_adjustments": {
+      "name": "model_proxy_usage_adjustments",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "request_id": {
+          "name": "request_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason": {
+          "name": "reason",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "prompt_tokens_delta": {
+          "name": "prompt_tokens_delta",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 0
+        },
+        "completion_tokens_delta": {
+          "name": "completion_tokens_delta",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 0
+        },
+        "total_cost_delta": {
+          "name": "total_cost_delta",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 0
+        },
+        "note": {
+          "name": "note",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "idx_usage_adjustments_request_created": {
+          "name": "idx_usage_adjustments_request_created",
+          "columns": [
+            {
+              "expression": "request_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "created_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "model_proxy_usage_adjustments_request_id_model_proxy_requests_id_fk": {
+          "name": "model_proxy_usage_adjustments_request_id_model_proxy_requests_id_fk",
+          "tableFrom": "model_proxy_usage_adjustments",
+          "tableTo": "model_proxy_requests",
+          "columnsFrom": [
+            "request_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    }
+  },
+  "enums": {},
+  "schemas": {},
+  "sequences": {},
+  "roles": {},
+  "policies": {},
+  "views": {},
+  "_meta": {
+    "columns": {},
+    "schemas": {},
+    "tables": {}
+  }
+}
\ No newline at end of file

diff --git a/database/src/schema/application-secrets.ts b/database/src/schema/application-secrets.ts
new file mode 100644
index 00000000..6ec7455e
--- /dev/null
+++ b/database/src/schema/application-secrets.ts
@@ -0,0 +1,27 @@
+import { sql } from "drizzle-orm";
+import { check, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
+import { modelProxyTable } from "./model-proxy/table";
+
+export const applicationSecretsStore = modelProxyTable(
+  "application_secrets_store",
+  {
+    id: uuid("id").defaultRandom().primaryKey(),
+    key: text("key").notNull(),
+    credentialEnvelope: text("credential_envelope").notNull(),
+    createdAt: timestamp("created_at").defaultNow().notNull(),
+    updatedAt: timestamp("updated_at")
+      .defaultNow()
+      .notNull()
+      .$onUpdate(() => new Date()),
+  },
+  (table) => [
+    uniqueIndex("uq_application_secrets_store_key").on(table.key),
+    check(
+      "ck_application_secrets_store_key_allowlist",
+      sql`${table.key} IN ('artificial_analysis_api_key', 'openrouter_api_key')`,
+    ),
+  ],
+);
+
+export type ApplicationSecret = typeof applicationSecretsStore.$inferSelect;
+export type NewApplicationSecret = typeof applicationSecretsStore.$inferInsert;

diff --git a/services/llm-config-service/src/repositories/application-secrets-repository.ts b/services/llm-config-service/src/repositories/application-secrets-repository.ts
new file mode 100644
index 00000000..fe7300ae
--- /dev/null
+++ b/services/llm-config-service/src/repositories/application-secrets-repository.ts
@@ -0,0 +1,108 @@
+import crypto from "node:crypto";
+import type { db as drizzleDb } from "@lite-llm/database/client";
+import { applicationSecretsStore } from "@lite-llm/database/schema";
+import { eq } from "drizzle-orm";
+
+export const APPLICATION_SECRET_KEYS = [
+  "artificial_analysis_api_key",
+  "openrouter_api_key",
+] as const;
+
+export type ApplicationSecretKey = (typeof APPLICATION_SECRET_KEYS)[number];
+
+export function isApplicationSecretKey(
+  value: string,
+): value is ApplicationSecretKey {
+  return APPLICATION_SECRET_KEYS.includes(value as ApplicationSecretKey);
+}
+
+function assertApplicationSecretKey(
+  value: string,
+): asserts value is ApplicationSecretKey {
+  if (!isApplicationSecretKey(value)) {
+    throw new Error("Unsupported application secret key");
+  }
+}
+
+export interface ApplicationSecretRecord {
+  key: ApplicationSecretKey;
+  credentialEnvelope: string;
+  createdAt: Date;
+  updatedAt: Date;
+}
+
+export interface ApplicationSecretUpsertData {
+  key: ApplicationSecretKey;
+  credentialEnvelope: string;
+}
+
+export interface ApplicationSecretsRepositoryPort {
+  findByKey(key: ApplicationSecretKey): Promise<ApplicationSecretRecord | null>;
+  upsert(data: ApplicationSecretUpsertData): Promise<ApplicationSecretRecord>;
+  deleteByKey(key: ApplicationSecretKey): Promise<boolean>;
+}
+
+function toRecord(row: {
+  key: string;
+  credentialEnvelope: string;
+  createdAt: Date;
+  updatedAt: Date;
+}): ApplicationSecretRecord {
+  return {
+    key: row.key as ApplicationSecretKey,
+    credentialEnvelope: row.credentialEnvelope,
+    createdAt: row.createdAt,
+    updatedAt: row.updatedAt,
+  };
+}
+
+export class ApplicationSecretsRepository
+  implements ApplicationSecretsRepositoryPort
+{
+  private readonly db: typeof drizzleDb;
+
+  constructor(db: typeof drizzleDb) {
+    this.db = db;
+  }
+
+  async findByKey(
+    key: ApplicationSecretKey,
+  ): Promise<ApplicationSecretRecord | null> {
+    const [row] = await this.db
+      .select()
+      .from(applicationSecretsStore)
+      .where(eq(applicationSecretsStore.key, key))
+      .limit(1);
+    return row ? toRecord(row) : null;
+  }
+
+  async upsert(
+    data: ApplicationSecretUpsertData,
+  ): Promise<ApplicationSecretRecord> {
+    assertApplicationSecretKey(data.key);
+    const [row] = await this.db
+      .insert(applicationSecretsStore)
+      .values({
+        id: crypto.randomUUID(),
+        key: data.key,
+        credentialEnvelope: data.credentialEnvelope,
+      })
+      .onConflictDoUpdate({
+        target: applicationSecretsStore.key,
+        set: {
+          credentialEnvelope: data.credentialEnvelope,
+          updatedAt: new Date(),
+        },
+      })
+      .returning();
+    return toRecord(row);
+  }
+
+  async deleteByKey(key: ApplicationSecretKey): Promise<boolean> {
+    const [deleted] = await this.db
+      .delete(applicationSecretsStore)
+      .where(eq(applicationSecretsStore.key, key))
+      .returning({ id: applicationSecretsStore.id });
+    return !!deleted;
+  }
+}

diff --git a/services/llm-config-service/src/services/application-secrets.service.ts b/services/llm-config-service/src/services/application-secrets.service.ts
new file mode 100644
index 00000000..fd800413
--- /dev/null
+++ b/services/llm-config-service/src/services/application-secrets.service.ts
@@ -0,0 +1,141 @@
+import type { DatabaseClient } from "@lite-llm/database/client";
+import {
+  encryptProviderSecret,
+  parseProviderEncryptionKey,
+  resolveProviderCredential,
+} from "../lib/provider-secrets.js";
+import {
+  APPLICATION_SECRET_KEYS,
+  type ApplicationSecretKey,
+  ApplicationSecretsRepository,
+  type ApplicationSecretsRepositoryPort,
+  isApplicationSecretKey,
+} from "../repositories/application-secrets-repository.js";
+
+export type { ApplicationSecretKey, ApplicationSecretsRepositoryPort };
+
+export interface ApplicationSecretPublic {
+  key: ApplicationSecretKey;
+  isConfigured: boolean;
+  createdAt: Date | null;
+  updatedAt: Date | null;
+}
+
+export interface ApplicationSecretsServiceOptions {
+  db?: DatabaseClient;
+  repository?: ApplicationSecretsRepositoryPort;
+  encryptionKey?: Buffer;
+}
+
+export interface IApplicationSecretsService {
+  list(): Promise<ApplicationSecretPublic[]>;
+  replace(
+    key: ApplicationSecretKey,
+    plaintext: string,
+  ): Promise<ApplicationSecretPublic>;
+  remove(key: ApplicationSecretKey): Promise<ApplicationSecretPublic>;
+  resolve(key: ApplicationSecretKey): Promise<string | null>;
+}
+
+function assertApplicationSecretKey(
+  value: string,
+): asserts value is ApplicationSecretKey {
+  if (!isApplicationSecretKey(value)) {
+    throw new Error("Unsupported application secret key");
+  }
+}
+
+function toUnconfigured(key: ApplicationSecretKey): ApplicationSecretPublic {
+  return {
+    key,
+    isConfigured: false,
+    createdAt: null,
+    updatedAt: null,
+  };
+}
+
+export class ApplicationSecretsService implements IApplicationSecretsService {
+  private readonly repository: ApplicationSecretsRepositoryPort;
+  private readonly encryptionKey: Buffer | undefined;
+
+  constructor(options: ApplicationSecretsServiceOptions = {}) {
+    this.repository =
+      options.repository ??
+      new ApplicationSecretsRepository(
+        options.db ??
+          (() => {
+            throw new Error(
+              "ApplicationSecretsService requires db or repository",
+            );
+          })(),
+      );
+    this.encryptionKey = options.encryptionKey;
+  }
+
+  async list(): Promise<ApplicationSecretPublic[]> {
+    return Promise.all(
+      APPLICATION_SECRET_KEYS.map(async (key) => {
+        const row = await this.repository.findByKey(key);
+        return row
+          ? {
+              key,
+              isConfigured: true,
+              createdAt: row.createdAt,
+              updatedAt: row.updatedAt,
+            }
+          : toUnconfigured(key);
+      }),
+    );
+  }
+
+  async replace(
+    key: ApplicationSecretKey,
+    plaintext: string,
+  ): Promise<ApplicationSecretPublic> {
+    assertApplicationSecretKey(key);
+    if (!plaintext.trim()) {
+      throw new Error("Application secret must be a non-empty string");
+    }
+
+    const record = await this.repository.upsert({
+      key,
+      credentialEnvelope: encryptProviderSecret(
+        plaintext,
+        this.getEncryptionKey(),
+      ),
+    });
+    return {
+      key: record.key,
+      isConfigured: true,
+      createdAt: record.createdAt,
+      updatedAt: record.updatedAt,
+    };
+  }
+
+  async remove(key: ApplicationSecretKey): Promise<ApplicationSecretPublic> {
+    assertApplicationSecretKey(key);
+    await this.repository.deleteByKey(key);
+    return toUnconfigured(key);
+  }
+
+  async resolve(key: ApplicationSecretKey): Promise<string | null> {
+    assertApplicationSecretKey(key);
+    const record = await this.repository.findByKey(key);
+    if (!record) {
+      return null;
+    }
+
+    try {
+      return resolveProviderCredential(
+        { credentialEnvelope: record.credentialEnvelope },
+        this.getEncryptionKey(),
+      );
+    } catch {
+      return null;
+    }
+  }
+
+  private getEncryptionKey(): Buffer {
+    return this.encryptionKey ?? parseProviderEncryptionKey();
+  }
+}

diff --git a/services/llm-config-service/src/services/__tests__/application-secrets.service.test.ts b/services/llm-config-service/src/services/__tests__/application-secrets.service.test.ts
new file mode 100644
index 00000000..dce123a3
--- /dev/null
+++ b/services/llm-config-service/src/services/__tests__/application-secrets.service.test.ts
@@ -0,0 +1,173 @@
+import { describe, expect, it } from "vitest";
+import { encryptProviderSecret } from "../../lib/provider-secrets.js";
+import { ApplicationSecretsRepository } from "../../repositories/application-secrets-repository.js";
+import {
+  type ApplicationSecretsRepositoryPort,
+  ApplicationSecretsService,
+} from "../application-secrets.service.js";
+
+const encryptionKey = Buffer.alloc(32, 7);
+
+function createRepository(): ApplicationSecretsRepositoryPort {
+  const rows = new Map<
+    string,
+    {
+      key: "artificial_analysis_api_key" | "openrouter_api_key";
+      credentialEnvelope: string;
+      createdAt: Date;
+      updatedAt: Date;
+    }
+  >();
+
+  return {
+    async findByKey(key) {
+      return rows.get(key) ?? null;
+    },
+    async upsert(input) {
+      const existing = rows.get(input.key);
+      const now = new Date();
+      const row = {
+        key: input.key,
+        credentialEnvelope: input.credentialEnvelope,
+        createdAt: existing?.createdAt ?? now,
+        updatedAt: now,
+      };
+      rows.set(input.key, row);
+      return row;
+    },
+    async deleteByKey(key) {
+      return rows.delete(key);
+    },
+  };
+}
+
+describe("ApplicationSecretsService", () => {
+  it("encrypts a replacement and returns public metadata only", async () => {
+    let persistedEnvelope: string | undefined;
+    const repository = createRepository();
+    const upsert = repository.upsert.bind(repository);
+    repository.upsert = async (input) => {
+      persistedEnvelope = input.credentialEnvelope;
+      return upsert(input);
+    };
+    const service = new ApplicationSecretsService({
+      repository,
+      encryptionKey,
+    });
+
+    const result = await service.replace(
+      "artificial_analysis_api_key",
+      "aa-live-secret",
+    );
+
+    expect(result).toEqual({
+      key: "artificial_analysis_api_key",
+      isConfigured: true,
+      createdAt: expect.any(Date),
+      updatedAt: expect.any(Date),
+    });
+    expect(JSON.stringify(result)).not.toContain("aa-live-secret");
+    expect(persistedEnvelope).toMatch(/^enc:v1:/);
+    expect(persistedEnvelope).not.toContain("aa-live-secret");
+    expect(await service.resolve("artificial_analysis_api_key")).toBe(
+      "aa-live-secret",
+    );
+  });
+
+  it("lists both allowlisted keys without exposing stored values", async () => {
+    const service = new ApplicationSecretsService({
+      repository: createRepository(),
+      encryptionKey,
+    });
+    await service.replace("openrouter_api_key", "or-live-secret");
+
+    expect(await service.list()).toEqual([
+      {
+        key: "artificial_analysis_api_key",
+        isConfigured: false,
+        createdAt: null,
+        updatedAt: null,
+      },
+      {
+        key: "openrouter_api_key",
+        isConfigured: true,
+        createdAt: expect.any(Date),
+        updatedAt: expect.any(Date),
+      },
+    ]);
+  });
+
+  it("rejects non-allowlisted and blank values", async () => {
+    const service = new ApplicationSecretsService({
+      repository: createRepository(),
+      encryptionKey,
+    });
+
+    await expect(
+      service.replace("unexpected_key" as never, "value"),
+    ).rejects.toThrow(/unsupported/i);
+    await expect(service.replace("openrouter_api_key", "   ")).rejects.toThrow(
+      /non-empty/i,
+    );
+  });
+
+  it("rejects a non-allowlisted key at the repository write boundary", async () => {
+    const repository = new ApplicationSecretsRepository({
+      insert: () => {
+        throw new Error("the database write must not be reached");
+      },
+    } as never);
+
+    await expect(
+      repository.upsert({
+        key: "unexpected_key" as never,
+        credentialEnvelope: "enc:v1:invalid",
+      }),
+    ).rejects.toThrow(/unsupported/i);
+  });
+
+  it("fails closed for missing, malformed, or undecryptable persisted values", async () => {
+    const repository = createRepository();
+    const service = new ApplicationSecretsService({
+      repository,
+      encryptionKey,
+    });
+
+    expect(await service.resolve("openrouter_api_key")).toBeNull();
+    await repository.upsert({
+      key: "openrouter_api_key",
+      credentialEnvelope: "not-an-envelope",
+    });
+    expect(await service.resolve("openrouter_api_key")).toBeNull();
+    await repository.upsert({
+      key: "openrouter_api_key",
+      credentialEnvelope: encryptProviderSecret(
+        "encrypted-with-another-key",
+        Buffer.alloc(32, 9),
+      ),
+    });
+    expect(await service.resolve("openrouter_api_key")).toBeNull();
+  });
+
+  it("removes idempotently and returns only unconfigured public metadata", async () => {
+    const service = new ApplicationSecretsService({
+      repository: createRepository(),
+      encryptionKey,
+    });
+
+    await service.replace("openrouter_api_key", "or-live-secret");
+
+    await expect(service.remove("openrouter_api_key")).resolves.toEqual({
+      key: "openrouter_api_key",
+      isConfigured: false,
+      createdAt: null,
+      updatedAt: null,
+    });
+    await expect(service.remove("openrouter_api_key")).resolves.toEqual({
+      key: "openrouter_api_key",
+      isConfigured: false,
+      createdAt: null,
+      updatedAt: null,
+    });
+  });
+});

```
