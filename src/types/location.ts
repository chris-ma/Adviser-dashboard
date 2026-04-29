import type { AustralianState } from './adviser';

export interface PostcodeRecord {
  postcode: string;
  suburb: string;
  state: AustralianState;
  sa4Code: string;
  sa4Name: string;
  lat: number;
  lng: number;
  population?: number;
  isMetro: boolean;
}

export interface GeographicAggregation {
  regionCode: string;
  regionName: string;
  regionType: 'postcode' | 'suburb' | 'sa4' | 'state';
  adviserCount: number;
  licenseeCount: number;
  practiceCount: number;
  population: number;
  advisersPerCapita: number;
  whiteSpaceScore: number;
  metroOrRegional: 'Metro' | 'Regional' | 'Remote';
  state: AustralianState;
  coordinates: [number, number];
}

export interface GeoQueryParams {
  level?: 'postcode' | 'suburb' | 'sa4' | 'state';
  state?: AustralianState;
  sa4?: string;
  metroOnly?: boolean;
}
