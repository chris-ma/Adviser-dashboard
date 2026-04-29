'use client';
import { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AdviserPersona, ConsumerPersona } from '@/types';

export function PersonaCard({ persona }: { persona: AdviserPersona | ConsumerPersona }) {
  const [expanded, setExpanded] = useState(false);
  const isAdviser = persona.side === 'Adviser';

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="h-1.5" style={{ background: persona.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="font-semibold text-sm">{persona.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{persona.tagline}</p>
          </div>
          {isAdviser && (
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold">{(persona as AdviserPersona).estimatedCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{(persona as AdviserPersona).percentageOfMarket}% of market</p>
            </div>
          )}
          {!isAdviser && (
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold">${(persona as ConsumerPersona).estimatedAddressableMarket}B</p>
              <p className="text-xs text-muted-foreground">addressable</p>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-4">{persona.description}</p>

        <div className="h-40 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={persona.radarDimensions}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9 }} />
              <Radar dataKey="score" stroke={persona.color} fill={persona.color} fillOpacity={0.2} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {isAdviser ? (
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div><span className="text-muted-foreground">Age</span><p>{(persona as AdviserPersona).demographicProfile.ageRange}</p></div>
            <div><span className="text-muted-foreground">Experience</span><p>{(persona as AdviserPersona).demographicProfile.yearsExperience}</p></div>
            <div><span className="text-muted-foreground">Revenue</span><p>{(persona as AdviserPersona).commercialProfile.revenueRange}</p></div>
            <div><span className="text-muted-foreground">Tech</span><p>{(persona as AdviserPersona).practiceProfile.technologyAdoption}</p></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div><span className="text-muted-foreground">Age</span><p>{(persona as ConsumerPersona).ageRange}</p></div>
            <div><span className="text-muted-foreground">Wealth</span><p>{(persona as ConsumerPersona).wealthComplexity}</p></div>
            <div><span className="text-muted-foreground">Income</span><p>{(persona as ConsumerPersona).householdIncome}</p></div>
            <div><span className="text-muted-foreground">Assets</span><p>{(persona as ConsumerPersona).investableAssets}</p></div>
          </div>
        )}


        <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          {expanded ? <><ChevronUp className="w-3 h-3" />Less</> : <><ChevronDown className="w-3 h-3" />Pain points & motivations</>}
        </button>

        {expanded && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t pt-3">
            <div>
              <p className="font-medium mb-1">Pain Points</p>
              <ul className="space-y-0.5 text-muted-foreground">
                {(isAdviser ? (persona as AdviserPersona).painPoints : (persona as ConsumerPersona).primaryConcerns).map(p => (
                  <li key={p} className="flex items-start gap-1"><span className="mt-0.5">·</span>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">{isAdviser ? 'Motivations' : 'Trigger Events'}</p>
              <ul className="space-y-0.5 text-muted-foreground">
                {(isAdviser ? (persona as AdviserPersona).motivations : (persona as ConsumerPersona).triggerEvents).map(m => (
                  <li key={m} className="flex items-start gap-1"><span className="mt-0.5">·</span>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
