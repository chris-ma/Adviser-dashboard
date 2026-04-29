'use client';
import { useWatchlistStore } from '@/store/watchlist.store';
import { useCompareStore } from '@/store/compare.store';
import { PageHeader } from '@/components/layout/PageHeader';
import { GitCompare, X, Star } from 'lucide-react';
import advisersData from '@/data/mock/advisers.json';
import licenseesData from '@/data/mock/licensees.json';
import type { Adviser, Licensee } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useState } from 'react';

export default function ComparePage() {
  const { entities, remove, clear, add } = useCompareStore();
  const { watched } = useWatchlistStore();
  const [search, setSearch] = useState('');

  const allAdvisers = advisersData as Adviser[];
  const allLicensees = licenseesData as Licensee[];

  const matches = search.length > 1
    ? [
        ...allAdvisers.filter(a => a.fullName.toLowerCase().includes(search.toLowerCase())).slice(0, 5).map(a => ({ id: a.id, name: a.fullName, type: 'adviser' as const })),
        ...allLicensees.filter(l => l.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5).map(l => ({ id: l.id, name: l.name, type: 'licensee' as const })),
      ]
    : [];

  function getAdviser(id: string) { return allAdvisers.find(a => a.id === id); }
  function getLicensee(id: string) { return allLicensees.find(l => l.id === id); }

  return (
    <div>
      <PageHeader
        title="Compare Entities"
        subtitle="Compare up to 5 advisers or licensees side by side"
        actions={entities.length > 0 ? (
          <button onClick={clear} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="w-4 h-4" />Clear all
          </button>
        ) : undefined}
      />

      {/* Add entities */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <p className="text-sm font-medium mb-2">Add adviser or licensee ({entities.length}/5)</p>
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…"
            className="w-full text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          {matches.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg mt-1 z-10">
              {matches.map(m => (
                <button key={m.id} onClick={() => { add(m); setSearch(''); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between">
                  <span>{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {watched.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1.5">From watchlist:</p>
            <div className="flex flex-wrap gap-2">
              {watched.map(w => (
                <button key={w.id} onClick={() => add(w)}
                  className="flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1 hover:bg-muted">
                  <Star className="w-3 h-3 text-yellow-500" />{w.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {entities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <GitCompare className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">Add advisers or licensees above to compare them side by side</p>
        </div>
      )}

      {entities.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-40">Attribute</th>
                {entities.map(e => (
                  <th key={e.id} className="px-4 py-3 min-w-[180px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-left">{e.name}</p>
                        <p className="text-xs text-muted-foreground font-normal capitalize">{e.type}</p>
                      </div>
                      <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-foreground ml-2">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Status', render: (ent: typeof entities[0]) => {
                  const a = getAdviser(ent.id); const l = getLicensee(ent.id);
                  return <StatusBadge status={a?.status ?? l?.status ?? '—'} />;
                }},
                { label: 'Type', render: (ent: typeof entities[0]) => <span className="capitalize">{ent.type}</span> },
                { label: 'State', render: (ent: typeof entities[0]) => {
                  const a = getAdviser(ent.id); const l = getLicensee(ent.id);
                  return <span>{a?.location.state ?? l?.headOfficeState ?? '—'}</span>;
                }},
                { label: 'Channel', render: (ent: typeof entities[0]) => {
                  const a = getAdviser(ent.id); const l = getLicensee(ent.id);
                  return <span>{a?.channel ?? l?.channel ?? '—'}</span>;
                }},
                { label: 'Yrs Exp / Advisers', render: (ent: typeof entities[0]) => {
                  const a = getAdviser(ent.id); const l = getLicensee(ent.id);
                  return <span className="font-medium">{a?.yearsExperience != null ? `${a.yearsExperience}y` : l?.adviserCount ?? '—'}</span>;
                }},
                { label: 'Current Entity', render: (ent: typeof entities[0]) => {
                  const a = getAdviser(ent.id); const l = getLicensee(ent.id);
                  return <span className="text-xs">{a?.currentLicenseeName ?? l?.parentGroup ?? '—'}</span>;
                }},
              ].map(row => (
                <tr key={row.label} className="border-t even:bg-muted/20">
                  <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{row.label}</td>
                  {entities.map(ent => (
                    <td key={ent.id} className="px-4 py-3">{row.render(ent)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
