import { asc } from "drizzle-orm";
import { litellmDb, schema } from "./client";

const { litellmCredentialsTable } = schema;
function mapRow(row) {
  return {
    credentialId: row.credentialId,
    credentialName: row.credentialName,
    credentialValues: row.credentialValues,
    credentialInfo: row.credentialInfo,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}
export async function getAllCredentials() {
  const result = await litellmDb
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
