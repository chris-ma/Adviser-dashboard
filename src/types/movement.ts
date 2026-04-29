export type MovementType = 'Join' | 'Exit' | 'Transfer' | 'Suspension' | 'Reinstatement' | 'Cancellation';

export interface MovementEvent {
  id: string;
  adviserId: string;
  adviserName: string;
  eventType: MovementType;
  fromLicenseeId?: string;
  fromLicenseeName?: string;
  toLicenseeId?: string;
  toLicenseeName?: string;
  eventDate: string;
  effectiveDate: string;
  source: string;
  notes?: string;
}

export interface MovementQueryParams {
  adviserId?: string;
  licenseeId?: string;
  eventType?: MovementType;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}
