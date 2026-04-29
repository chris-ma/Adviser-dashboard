import type { AdviserChannel, AustralianState } from './adviser';

export interface MarketStateBreakdown {
  state: AustralianState;
  adviserCount: number;
  businessCount: number;
  revenue: number;
  penetrationRate: number;
}

export interface MarketChannelBreakdown {
  channel: AdviserChannel;
  adviserCount: number;
  percentage: number;
}

export interface MarketSizeSnapshot {
  asAtDate: string;
  source: string;
  methodology: string;
  totalRevenue: number;
  totalBusinesses: number;
  totalAdvisers: number;
  totalLicensees: number;
  averageRevenuePerBusiness: number;
  averageAdvisersPerPractice: number;
  penetrationRate: number;
  byState: MarketStateBreakdown[];
  byChannel: MarketChannelBreakdown[];
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  note?: string;
}

export interface MarketTimeSeries {
  metric: string;
  unit: string;
  source: string;
  dataPoints: TimeSeriesDataPoint[];
}
