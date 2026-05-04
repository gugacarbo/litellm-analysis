import { asc, eq } from "drizzle-orm";
import { db, schema } from "./client";

const { litellmCredentialsTable } = schema;

// Credential type for model configuration
export interface LiteLLMCredential {
  credentialId: string;
  credentialName: string;
  credentialValues: Record<string, unknown> | null;
  credentialInfo: Record<string, unknown> | null;
  createdAt: Date | null;
  createdBy: string | null;
  updatedAt: Date | null;
  updatedBy: string | null;
}

function mapRow(row: {
  credentialId: string;
  credentialName: string;
  credentialValues: unknown;
  credentialInfo: unknown;
  createdAt: Date | null;
  createdBy: string | null;
  updatedAt: Date | null;
  updatedBy: string | null;
}): LiteLLMCredential {
  return {
    credentialId: row.credentialId,
    credentialName: row.credentialName,
    credentialValues: row.credentialValues as Record<string, unknown> | null,
    credentialInfo: row.credentialInfo as Record<string, unknown> | null,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}

export async function getAllCredentials(): Promise<LiteLLMCredential[]> {
  const result = await db
    .select({
      credentialId: litellmCredentialsTable.credentialId,
      credentialName: litellmCredentialsTable.credentialName,
      credentialValues: litellmCredentialsTable.credentialValues,
      credentialInfo: litellmCredentialsTable.credentialInfo,
      createdAt: litellmCredentialsTable.createdAt,
      createdBy: litellmCredentialsTable.createdBy,
      updatedAt: litellmCredentialsTable.updatedAt,
      updatedBy: litellmCredentialsTable.updatedBy,
    })
    .from(litellmCredentialsTable)
    .orderBy(asc(litellmCredentialsTable.credentialName));

  return result.map(mapRow);
}

export async function getCredentialByName(
  credentialName: string,
): Promise<LiteLLMCredential | null> {
  const result = await db
    .select({
      credentialId: litellmCredentialsTable.credentialId,
      credentialName: litellmCredentialsTable.credentialName,
      credentialValues: litellmCredentialsTable.credentialValues,
      credentialInfo: litellmCredentialsTable.credentialInfo,
      createdAt: litellmCredentialsTable.createdAt,
      createdBy: litellmCredentialsTable.createdBy,
      updatedAt: litellmCredentialsTable.updatedAt,
      updatedBy: litellmCredentialsTable.updatedBy,
    })
    .from(litellmCredentialsTable)
    .where(eq(litellmCredentialsTable.credentialName, credentialName))
    .limit(1);

  return result[0] ? mapRow(result[0]) : null;
}
