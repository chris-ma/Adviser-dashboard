import { PageHeader } from '@/components/layout/PageHeader';
import { CompetitorClient } from '@/components/competitor/CompetitorClient';
import licenseesData from '@/data/mock/licensees.json';
import movementsData from '@/data/mock/movements.json';
import type { Licensee, MovementEvent } from '@/types';

export default function CompetitorPage() {
  const licensees = licenseesData as Licensee[];
  const movements = (movementsData as MovementEvent[]).slice(0, 100);
  return (
    <div>
      <PageHeader
        title="Competitor Intelligence"
        subtitle={`${licensees.length} AFS licensees tracked`}
        source="ASIC Financial Adviser Register"
        asAtDate="31 March 2024"
      />
      <CompetitorClient licensees={licensees} movements={movements} />
    </div>
  );
}
