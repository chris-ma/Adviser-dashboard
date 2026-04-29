'use client';
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, TrendingUp } from 'lucide-react';

const AustraliaMap = dynamic(() => import('./AustraliaMap'), { ssr: false, loading: () => (
  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Loading map…</div>
)});

const STATES = ['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'];

export function GeographicClient({ regions }: { regions: any[] }) {
  const [stateFilter, setStateFilter] = useState('');
  const [view, setView] = useState<'density' | 'whitespace'>('density');
  const [selected, setSelected] = useState<any>(null);

  const filtered = useMemo(() =>
    stateFilter ? regions.filter(r => r.state === stateFilter) : regions,
    [regions, stateFilter]
  );

  const topWhitespace = useMemo(() =>
    [...regions].sort((a, b) => b.whiteSpaceScore - a.whiteSpaceScore).slice(0, 10),
    [regions]
  );

  const totalAdvisers = filtered.reduce((s, r) => s + r.adviserCount, 0);
  const avgWhitespace = Math.round(filtered.reduce((s, r) => s + r.whiteSpaceScore, 0) / (filtered.length || 1));

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
          className="text-sm border rounded-md px-2 py-1.5 bg-white">
          <option value="">All States</option>
          {STATES.map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="flex border rounded-md overflow-hidden bg-white">
          {(['density','whitespace'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm ${view === v ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}>
              {v === 'density' ? 'Density' : 'White Space'}
            </button>
          ))}
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground ml-auto">
          <span><strong className="text-foreground">{totalAdvisers.toLocaleString()}</strong> advisers</span>
          <span>Avg WS: <strong className="text-foreground">{avgWhitespace}</strong>/100</span>
        </div>
      </div>

      {/* Map + side panel — stacks on mobile, side-by-side on lg */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="bg-white rounded-lg border overflow-hidden flex-1" style={{ height: 420 }}>
          <AustraliaMap regions={filtered} view={view} onSelect={setSelected} />
        </div>

        {/* Right panel */}
        <div className="lg:w-72 space-y-4">
          {/* Selected region */}
          {selected && (
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-semibold text-sm flex items-center gap-1.5 mb-3">
                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="truncate">{selected.regionName}</span>
              </h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">State</span><span>{selected.state}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Advisers</span><span className="font-medium">{selected.adviserCount}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Practices</span><span>{selected.practiceCount}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Per 10K adults</span><span>{selected.advisersPerCapita}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Area type</span><span>{selected.metroOrRegional}</span></div>
                <div className="border-t pt-2 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">White-space</span>
                    <span className={`font-bold text-lg ${selected.whiteSpaceScore > 60 ? 'text-green-600' : selected.whiteSpaceScore > 30 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {selected.whiteSpaceScore}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${selected.whiteSpaceScore}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top opportunity regions */}
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-semibold text-sm flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-4 h-4 text-green-600" />Top Opportunity Regions
            </h4>
            <div className="space-y-1">
              {topWhitespace.map((r, i) => (
                <button key={r.regionCode} onClick={() => setSelected(r)}
                  className="w-full flex items-center justify-between text-xs hover:bg-muted/50 rounded px-1 py-1 transition-colors">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-4 text-muted-foreground flex-shrink-0">{i + 1}</span>
                    <span className="truncate">{r.regionName}</span>
                    <span className="text-muted-foreground flex-shrink-0">({r.state})</span>
                  </span>
                  <span className="font-bold text-green-600 flex-shrink-0 ml-2">{r.whiteSpaceScore}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
