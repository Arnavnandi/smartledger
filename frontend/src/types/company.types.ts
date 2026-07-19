export interface CompanyProfile {
  id: number;
  name: string;
  gstNumber?: string;
  address?: string;
  logoUrl?: string;
  currency: string;
  taxRate: number;
  invoicePrefix: string;
}

export interface CompanyProfileUpdateRequest {
  name: string;
  gstNumber?: string;
  address?: string;
  currency?: string;
  taxRate?: number;
  invoicePrefix?: string;
}
