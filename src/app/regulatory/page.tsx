'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import regulatoryData from '@/data/mock/regulatory.json';
import type { RegulatoryItem } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ChevronDown, ChevronUp } from 'lucide-react';

const impactColors: Record<string, string> = {
  High: 'bg-red-50 text-red-700 ring-red-600/20',
  Medium: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  Low: 'bg-green-50 text-green-700 ring-green-600/20',
  Watch: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

function ImpactBadge({ impact }: { impact: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${impactColors[impact] ?? ''}`}>
      {impact}
    </span>
  );
}

function RegulatoryItemCard({ item }: { item: RegulatoryItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ImpactBadge impact={item.impact} />
            <StatusBadge status={item.status} />
            <span className="text-xs text-muted-foreground">{item.source}</span>
          </div>
          <h3 className="font-semibold text-sm">{item.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground flex-shrink-0">
          <p>{new Date(item.publishedDate).toLocaleDateString('en-AU', { year: 'numeric', month: 'short' })}</p>
          {item.effectiveDate && <p className="mt-0.5">Effective: {new Date(item.effectiveDate).toLocaleDateString('en-AU', { year: 'numeric', month: 'short' })}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {item.tags.map(t => <span key={t} className="text-xs bg-muted px-2 py-0.5 rounded">{t}</span>)}
      </div>

      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-3">
        {open ? <><ChevronUp className="w-3 h-3" />Less</> : <><ChevronDown className="w-3 h-3" />Commercial impact</>}
      </button>
      {open && (
        <div className="mt-3 p-3 bg-blue-50 rounded-md text-xs text-blue-900 border border-blue-100">
          <p className="font-medium mb-1">Commercial Impact</p>
          <p>{item.impactSummary}</p>
          <p className="mt-2 text-blue-700">Affected: {item.affectedParties.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

export default function RegulatoryPage() {
  const [impact, setImpact] = useState('');
  const [status, setStatus] = useState('');
  const items = regulatoryData as RegulatoryItem[];

  const filtered = items.filter(i =>
    (!impact || i.impact === impact) && (!status || i.status === status)
  ).sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));

  return (
    <div>
      <PageHeader
        title="Regulatory Radar"
        subtitle="Policy changes affecting adviser supply, economics, and business models"
        source="ASIC / Treasury / APRA / AFCA"
        asAtDate="31 March 2024"
      />
      <div className="flex gap-3 mb-4">
        <select value={impact} onChange={e => setImpact(e.target.value)} className="text-sm border rounded-md px-2 py-1.5 bg-white">
          <option value="">All impact levels</option>
          {['High','Medium','Low','Watch'].map(i => <option key={i}>{i}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="text-sm border rounded-md px-2 py-1.5 bg-white">
          <option value="">All statuses</option>
          {['Enacted','Consultation','Proposed','Monitoring'].map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-muted-foreground self-center">{filtered.length} items</span>
      </div>
      <div className="space-y-3">
        {filtered.map(item => <RegulatoryItemCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}
