export type AdviserStatus = 'Active' | 'Suspended' | 'Cancelled' | 'Lapsed';
export type AdviserChannel = 'Aligned' | 'Independent' | 'Institutional' | 'Direct';
export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';

export interface Qualification {
  id: string;
  code: string;
  name: string;
  institution: string;
  yearCompleted: number;
}

export interface ProductAuthority {
  id: string;
  category: string;
  subCategory?: string;
  grantedBy: string;
  grantedDate: string;
  status: 'Current' | 'Removed';
}

export interface WorkHistoryEntry {
  id: string;
  firmName: string;
  licenseeName: string;
  licenseeAFSL: string;
  role: string;
  startDate: string;
  endDate?: string;
  isCurrentRole: boolean;
}

export interface Adviser {
  id: string;
  adviserId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: AdviserStatus;
  registrationDate: string;
  channel: AdviserChannel;
  currentLicenseeId: string;
  currentLicenseeName: string;
  currentFirmName: string;
  location: {
    postcode: string;
    suburb: string;
    state: AustralianState;
    sa4Region: string;
    sa4Code: string;
    isMetro: boolean;
  };
  qualifications: Qualification[];
  productAuthorities: ProductAuthority[];
  workHistory: WorkHistoryEntry[];
  yearsExperience: number;
  specialisations: string[];
  lastUpdated: string;
}

export interface AdviserQueryParams {
  q?: string;
  status?: AdviserStatus;
  state?: AustralianState;
  channel?: AdviserChannel;
  licenseeId?: string;
  postcode?: string;
  sa4?: string;
  productAuthority?: string;
  qualification?: string;
  specialisation?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'lastName' | 'registrationDate' | 'yearsExperience';
  sortDir?: 'asc' | 'desc';
}
