import { prisma } from "./client";

interface LiteLLMCredential {
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
  credential_id: string;
  credential_name: string;
  credential_values: unknown;
  credential_info: unknown;
  created_at: Date | null;
  created_by: string | null;
  updated_at: Date | null;
  updated_by: string | null;
}): LiteLLMCredential {
  return {
    credentialId: row.credential_id,
    credentialName: row.credential_name,
    credentialValues: row.credential_values as Record<string, unknown> | null,
    credentialInfo: row.credential_info as Record<string, unknown> | null,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export async function getAllCredentials(): Promise<LiteLLMCredential[]> {
  const result = await prisma.$queryRawUnsafe<
    Array<{
      credential_id: string;
      credential_name: string;
      credential_values: unknown;
      credential_info: unknown;
      created_at: Date | null;
      created_by: string | null;
      updated_at: Date | null;
      updated_by: string | null;
    }>
  >(`
    SELECT
      "credential_id",
      "credential_name",
      "credential_values",
      "credential_info",
      "created_at",
      "created_by",
      "updated_at",
      "updated_by"
    FROM "LiteLLM_CredentialsTable"
    ORDER BY "credential_name" ASC
  `);

  return result.map(mapRow);
}
