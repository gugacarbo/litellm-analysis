export interface ProviderRecord {
  id: string;
  name: string;
  provider: string | null;
  baseUrl: string | null;
  secretRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderCreateInput {
  name: string;
  provider?: string | null;
  baseUrl?: string | null;
  secretRef?: string;
}

export type ProviderUpdateInput = Partial<Omit<ProviderCreateInput, "name">> & {
  name?: string;
};
