import {
  getAllCredentials,
  getDefaultCredential,
  setDefaultCredential,
} from "../queries/index.js";
export async function getCredentialsImpl() {
  const result = await getAllCredentials();
  return result.map((item) => ({
    credentialId: item.credentialId,
    credentialName: item.credentialName,
    credentialValues: item.credentialValues,
    credentialInfo: item.credentialInfo,
    createdAt: item.createdAt ? String(item.createdAt) : null,
    createdBy: item.createdBy,
    updatedAt: item.updatedAt ? String(item.updatedAt) : null,
    updatedBy: item.updatedBy,
  }));
}
export async function getDefaultCredentialImpl() {
  return getDefaultCredential();
}
export async function setDefaultCredentialImpl(credentialAlias) {
  await setDefaultCredential(credentialAlias);
}
