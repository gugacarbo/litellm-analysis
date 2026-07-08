export interface ProviderRecord {
  id: string;
  name: string;
  isDefault: boolean;
  provider: string | null;
  baseUrl: string | null;
  apiKey: string | null;
  secretRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderCreateInput {
  name: string;
  isDefault?: boolean;
  provider?: string | null;
  baseUrl?: string | null;
  apiKey?: string;
  secretRef?: string | null;
}

export type ProviderUpdateInput = Partial<Omit<ProviderCreateInput, "name">> & {
  name?: string;
};
