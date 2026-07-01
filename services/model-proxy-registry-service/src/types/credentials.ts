export interface CredentialRecord {
  id: string;
  name: string;
  provider: string | null;
  baseUrl: string | null;
  secretRef: string | null;
  /** Legacy import only — never written by registry service. */
  apiKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CredentialCreateInput {
  name: string;
  provider?: string | null;
  baseUrl?: string | null;
  apiKey?: string;
  secretRef?: string;
}

export type CredentialUpdateInput = Partial<
  Omit<CredentialCreateInput, "name">
> & {
  name?: string;
};
