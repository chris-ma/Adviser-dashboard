'use client';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { Licensee, MovementEvent } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WatchlistButton } from '@/components/shared/WatchlistButton';
import { MovementFeed } from './MovementFeed';
import { LicenseeGrowthSparkline } from './LicenseeGrowthSparkline';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TIERS = ['Top 20','Mid-tier','Boutique','Self-licensed'];
const CHANNELS = ['Aligned','Independent','Institutional','Direct'];

export function CompetitorClient({ licensees, movements }: { licensees: Licensee[]; movements: MovementEvent[] }) {
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('');
  const [channel, setChannel] = useState('');

  const filtered = useMemo(() => {
    let d = licensees;
    if (q) { const s = q.toLowerCase(); d = d.filter(l => l.name.toLowerCase().includes(s) || l.afslNumber.includes(s)); }
    if (tier) d = d.filter(l => l.tier === tier);
    if (channel) d = d.filter(l => l.channel === channel);
    return d.sort((a, b) => b.adviserCount - a.adviserCount);
  }, [licensees, q, tier, channel]);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Filters + table */}
      <div className="col-span-2">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search licensee or AFSL…"
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={tier} onChange={e => setTier(e.target.value)} className="text-sm border rounded-md px-2 py-1.5 bg-white">
            <option value="">All tiers</option>{TIERS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={channel} onChange={e => setChannel(e.target.value)} className="text-sm border rounded-md px-2 py-1.5 bg-white">
            <option value="">All channels</option>{CHANNELS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {['Licensee','AFSL','Tier','Channel','Advisers','Trend','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/competitor/${l.id}`} className="font-medium hover:text-blue-600 hover:underline">
                      <div className="max-w-[200px] truncate">{l.name}</div>
                    </Link>
                    {l.parentGroup && <div className="text-xs text-muted-foreground">{l.parentGroup}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.afslNumber}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{l.tier}</span></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{l.channel}</td>
                  <td className="px-4 py-3 font-bold">{l.adviserCount}</td>
                  <td className="px-4 py-3"><LicenseeGrowthSparkline history={l.adviserCountHistory} /></td>
                  <td className="px-4 py-3"><WatchlistButton id={l.id} name={l.name} type="licensee" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Feed */}
      <div>
        <div className="bg-white rounded-lg border p-4 sticky top-4">
          <h3 className="text-sm font-semibold mb-3">Recent Movements</h3>
          <MovementFeed movements={movements} />
        </div>
      </div>
    </div>
  );
}
