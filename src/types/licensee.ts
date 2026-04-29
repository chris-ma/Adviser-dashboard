import type { AdviserChannel, AustralianState } from './adviser';

export type LicenseeStatus = 'Current' | 'Cancelled' | 'Suspended';
export type LicenseeTier = 'Top 20' | 'Mid-tier' | 'Boutique' | 'Self-licensed';

export interface LicenseeGrowthPoint {
  date: string;
  count: number;
}

export interface Licensee {
  id: string;
  afslNumber: string;
  name: string;
  tradingName?: string;
  parentGroup?: string;
  abn: string;
  acn?: string;
  registrationDate: string;
  status: LicenseeStatus;
  headOfficeState: AustralianState;
  headOfficePostcode: string;
  adviserCount: number;
  practiceCount: number;
  channel: AdviserChannel;
  fum?: number;
  revenueEstimate?: number;
  tier: LicenseeTier;
  products: string[];
  website?: string;
  adviserCountHistory: LicenseeGrowthPoint[];
  description?: string;
}

export interface LicenseeQueryParams {
  q?: string;
  status?: LicenseeStatus;
  state?: AustralianState;
  channel?: AdviserChannel;
  tier?: LicenseeTier;
  minAdvisers?: number;
  maxAdvisers?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'adviserCount' | 'registrationDate';
  sortDir?: 'asc' | 'desc';
}
