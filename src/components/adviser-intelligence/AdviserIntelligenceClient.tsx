'use client';
import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, ChevronRight, X } from 'lucide-react';
import type { Adviser, Licensee } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WatchlistButton } from '@/components/shared/WatchlistButton';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STATES = ['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'];
const CHANNELS = ['Aligned','Independent','Institutional','Direct'];
const STATUSES = ['Active','Suspended','Cancelled','Lapsed'];

interface Filters {
  q: string; status: string; state: string; channel: string; licenseeId: string;
}

export function AdviserIntelligenceClient({ advisers, licensees }: { advisers: Adviser[]; licensees: Licensee[] }) {
  const [filters, setFilters] = useState<Filters>({ q: '', status: '', state: '', channel: '', licenseeId: '' });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 20;

  const filtered = useMemo(() => {
    let d = advisers;
    if (filters.q) {
      const s = filters.q.toLowerCase();
      d = d.filter(a => a.fullName.toLowerCase().includes(s) || a.currentLicenseeName.toLowerCase().includes(s) || a.adviserId.toLowerCase().includes(s));
    }
    if (filters.status) d = d.filter(a => a.status === filters.status);
    if (filters.state) d = d.filter(a => a.location.state === filters.state);
    if (filters.channel) d = d.filter(a => a.channel === filters.channel);
    if (filters.licenseeId) d = d.filter(a => a.currentLicenseeId === filters.licenseeId);
    return d;
  }, [advisers, filters]);

  const pages = Math.ceil(filtered.length / pageSize);
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);
  const set = (k: keyof Filters, v: string) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };
  const activeFilters = Object.entries(filters).filter(([k, v]) => k !== 'q' && v).length;

  return (
    <div>
      {/* Search + filter bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={filters.q}
            onChange={e => set('q', e.target.value)}
            placeholder="Search by name, adviser ID, or licensee…"
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={cn('flex items-center gap-2 px-3 py-2 text-sm border rounded-md bg-white',
            showFilters || activeFilters > 0 ? 'border-blue-500 text-blue-600' : 'hover:bg-muted'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters {activeFilters > 0 && <span className="bg-blue-600 text-white text-xs rounded-full px-1.5">{activeFilters}</span>}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 bg-white rounded-lg border">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select value={filters.status} onChange={e => set('status', e.target.value)} className="mt-1 w-full text-sm border rounded-md px-2 py-1.5">
              <option value="">All</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">State</label>
            <select value={filters.state} onChange={e => set('state', e.target.value)} className="mt-1 w-full text-sm border rounded-md px-2 py-1.5">
              <option value="">All</option>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Channel</label>
            <select value={filters.channel} onChange={e => set('channel', e.target.value)} className="mt-1 w-full text-sm border rounded-md px-2 py-1.5">
              <option value="">All</option>
              {CHANNELS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Licensee</label>
            <select value={filters.licenseeId} onChange={e => set('licenseeId', e.target.value)} className="mt-1 w-full text-sm border rounded-md px-2 py-1.5">
              <option value="">All</option>
              {licensees.map(l => <option key={l.id} value={l.id}>{l.name.slice(0, 40)}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-3">{filtered.length.toLocaleString()} advisers</p>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {['Name','ASIC ID','Licensee','Status','State','Channel','Exp','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map(a => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/adviser-intelligence/${a.id}`} className="hover:text-blue-600 hover:underline">
                      {a.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{a.adviserId}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate" title={a.currentLicenseeName}>{a.currentLicenseeName}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3">{a.location.state}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.channel}</td>
                  <td className="px-4 py-3">{a.yearsExperience}y</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <WatchlistButton id={a.id} name={a.fullName} type="adviser" />
                      <Link href={`/adviser-intelligence/${a.id}`} className="p-1.5 text-muted-foreground hover:text-foreground">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-muted">Prev</button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-muted">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
