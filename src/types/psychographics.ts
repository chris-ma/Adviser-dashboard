import type { AdviserChannel } from './adviser';

export type PersonaSide = 'Adviser' | 'Consumer';
export type TechAdoption = 'Low' | 'Medium' | 'High';
export type WealthComplexity = 'Low' | 'Medium' | 'High' | 'Very High';
export type RetirementReadiness = 'Early Saver' | 'Accumulator' | 'Pre-Retiree' | 'Retired';
export type EngagementLikelihood = 'Low' | 'Medium' | 'High';

export interface RadarDimension {
  dimension: string;
  score: number;
}

export interface AdviserPersona {
  id: string;
  side: 'Adviser';
  name: string;
  tagline: string;
  description: string;
  demographicProfile: {
    ageRange: string;
    yearsExperience: string;
    typicalChannel: AdviserChannel;
    locationBias: string;
  };
  practiceProfile: {
    clientCount: string;
    avgClientFUM: string;
    primarySpecialisations: string[];
    technologyAdoption: TechAdoption;
  };
  commercialProfile: {
    feeModel: string;
    revenueRange: string;
    growthOrientation: 'Organic' | 'Acquisition' | 'Both';
  };
  painPoints: string[];
  motivations: string[];
  estimatedCount: number;
  percentageOfMarket: number;
  radarDimensions: RadarDimension[];
  color: string;
}

export interface ConsumerPersona {
  id: string;
  side: 'Consumer';
  name: string;
  tagline: string;
  description: string;
  lifeStage: string;
  ageRange: string;
  wealthComplexity: WealthComplexity;
  retirementReadiness: RetirementReadiness;
  householdIncome: string;
  investableAssets: string;
  primaryConcerns: string[];
  triggerEvents: string[];
  adviserEngagementLikelihood: EngagementLikelihood;
  estimatedAddressableMarket: number;
  radarDimensions: RadarDimension[];
  color: string;
}

export type Persona = AdviserPersona | ConsumerPersona;
