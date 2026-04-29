import { notFound } from 'next/navigation';
import licenseesData from '@/data/mock/licensees.json';
import movementsData from '@/data/mock/movements.json';
import type { Licensee, MovementEvent } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WatchlistButton } from '@/components/shared/WatchlistButton';
import { MovementFeed } from '@/components/competitor/MovementFeed';
import { LicenseeGrowthChart } from '@/components/competitor/LicenseeGrowthChart';
import { formatDate } from '@/lib/utils';

export default function LicenseeDetailPage({ params }: { params: { licenseeId: string } }) {
  const licensee = (licenseesData as Licensee[]).find(l => l.id === params.licenseeId);
  if (!licensee) notFound();

  const movements = (movementsData as MovementEvent[])
    .filter(m => m.fromLicenseeId === licensee.id || m.toLicenseeId === licensee.id)
    .slice(0, 30);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={licensee.name}
        subtitle={`AFSL ${licensee.afslNumber} · ${licensee.tier} · ${licensee.channel}`}
        source="ASIC Financial Adviser Register"
        asAtDate="31 March 2024"
        actions={<WatchlistButton id={licensee.id} name={licensee.name} type="licensee" />}
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-5">
          <h3 className="text-sm font-semibold mb-3">Licensee Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Status</span><p className="mt-0.5"><StatusBadge status={licensee.status} /></p></div>
            <div><span className="text-muted-foreground">Parent Group</span><p className="mt-0.5">{licensee.parentGroup ?? '—'}</p></div>
            <div><span className="text-muted-foreground">Advisers</span><p className="mt-0.5 font-bold text-lg">{licensee.adviserCount}</p></div>
            <div><span className="text-muted-foreground">Practices</span><p className="mt-0.5">{licensee.practiceCount}</p></div>
            <div><span className="text-muted-foreground">Head Office</span><p className="mt-0.5">{licensee.headOfficeState}</p></div>
            <div><span className="text-muted-foreground">Registered</span><p className="mt-0.5">{formatDate(licensee.registrationDate)}</p></div>
            {licensee.fum && <div><span className="text-muted-foreground">FUM (AUD M)</span><p className="mt-0.5">${licensee.fum.toLocaleString()}M</p></div>}
          </div>
        </div>
        <LicenseeGrowthChart history={licensee.adviserCountHistory} />
      </div>

      {movements.length > 0 && (
        <div className="bg-white rounded-lg border p-5">
          <h3 className="text-sm font-semibold mb-3">Adviser Movements</h3>
          <MovementFeed movements={movements} />
        </div>
      )}
    </div>
  );
}
