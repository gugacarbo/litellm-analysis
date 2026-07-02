export interface ProviderRecord {
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

export interface ProviderCreateInput {
  name: string;
  provider?: string | null;
  baseUrl?: string | null;
  apiKey?: string;
  secretRef?: string;
}

export type ProviderUpdateInput = Partial<
  Omit<ProviderCreateInput, "name">
> & {
  name?: string;
};
