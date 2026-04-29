import { notFound } from 'next/navigation';
import advisersData from '@/data/mock/advisers.json';
import movementsData from '@/data/mock/movements.json';
import type { Adviser, MovementEvent } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WatchlistButton } from '@/components/shared/WatchlistButton';
import { formatDate } from '@/lib/utils';
import { MapPin, Briefcase, GraduationCap, Shield } from 'lucide-react';

export default function AdviserDetailPage({ params }: { params: { adviserId: string } }) {
  const adviser = (advisersData as Adviser[]).find(a => a.id === params.adviserId);
  if (!adviser) notFound();

  const movements = (movementsData as MovementEvent[])
    .filter(m => m.adviserId === adviser.id)
    .slice(0, 10);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={adviser.fullName}
        subtitle={`${adviser.currentFirmName} · ${adviser.location.suburb}, ${adviser.location.state}`}
        source="ASIC Financial Adviser Register"
        asAtDate="31 March 2024"
        actions={<WatchlistButton id={adviser.id} name={adviser.fullName} type="adviser" />}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 col-span-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">ASIC ID</span><p className="font-mono mt-0.5">{adviser.adviserId}</p></div>
            <div><span className="text-muted-foreground">Status</span><p className="mt-0.5"><StatusBadge status={adviser.status} /></p></div>
            <div><span className="text-muted-foreground">Channel</span><p className="mt-0.5">{adviser.channel}</p></div>
            <div><span className="text-muted-foreground">Years Experience</span><p className="mt-0.5">{adviser.yearsExperience} years</p></div>
            <div><span className="text-muted-foreground">Registered</span><p className="mt-0.5">{formatDate(adviser.registrationDate)}</p></div>
            <div><span className="text-muted-foreground">SA4 Region</span><p className="mt-0.5">{adviser.location.sa4Region}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Specialisations</p>
          <div className="flex flex-wrap gap-1.5">
            {adviser.specialisations.map(s => (
              <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Work History */}
        <div className="bg-white rounded-lg border p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4"><Briefcase className="w-4 h-4" />Work History</h3>
          <div className="space-y-4">
            {adviser.workHistory.map((w, i) => (
              <div key={w.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full mt-1 ${w.isCurrentRole ? 'bg-blue-600' : 'bg-muted-foreground'}`} />
                  {i < adviser.workHistory.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">{w.firmName}</p>
                  <p className="text-xs text-muted-foreground">{w.role}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(w.startDate)} — {w.endDate ? formatDate(w.endDate) : 'Present'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Qualifications */}
          <div className="bg-white rounded-lg border p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><GraduationCap className="w-4 h-4" />Qualifications</h3>
            <div className="space-y-2">
              {adviser.qualifications.map(q => (
                <div key={q.id} className="text-sm">
                  <p className="font-medium">{q.name}</p>
                  <p className="text-xs text-muted-foreground">{q.institution} · {q.yearCompleted}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Product Authorities */}
          <div className="bg-white rounded-lg border p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Shield className="w-4 h-4" />Product Authorities</h3>
            <div className="space-y-1.5">
              {adviser.productAuthorities.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-xs">{p.category}</span>
                  <span className={`text-xs font-medium ${p.status === 'Current' ? 'text-green-600' : 'text-red-500'}`}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Movement history */}
      {movements.length > 0 && (
        <div className="mt-4 bg-white rounded-lg border p-5">
          <h3 className="text-sm font-semibold mb-3">Movement History</h3>
          <div className="space-y-2">
            {movements.map(m => (
              <div key={m.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <span className="text-muted-foreground">{formatDate(m.eventDate)}</span>
                <span className="font-medium">{m.eventType}</span>
                <span className="text-muted-foreground text-xs">
                  {m.fromLicenseeName && `From: ${m.fromLicenseeName.slice(0, 30)}`}
                  {m.toLicenseeName && ` → ${m.toLicenseeName.slice(0, 30)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
