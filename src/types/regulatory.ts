export type RegulatoryImpact = 'High' | 'Medium' | 'Low' | 'Watch';
export type RegulatoryStatus = 'Enacted' | 'Consultation' | 'Proposed' | 'Monitoring';

export interface RegulatoryItem {
  id: string;
  title: string;
  summary: string;
  fullText?: string;
  source: string;
  sourceUrl?: string;
  publishedDate: string;
  effectiveDate?: string;
  status: RegulatoryStatus;
  impact: RegulatoryImpact;
  affectedParties: string[];
  tags: string[];
  impactSummary: string;
}

export interface RegulatoryQueryParams {
  source?: string;
  impact?: RegulatoryImpact;
  status?: RegulatoryStatus;
  tag?: string;
  fromDate?: string;
  toDate?: string;
}
