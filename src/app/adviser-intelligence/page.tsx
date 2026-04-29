import { AdviserIntelligenceClient } from '@/components/adviser-intelligence/AdviserIntelligenceClient';
import { PageHeader } from '@/components/layout/PageHeader';
import { ExportButton } from '@/components/shared/ExportButton';
import advisersData from '@/data/mock/advisers.json';
import licenseesData from '@/data/mock/licensees.json';
import type { Adviser, Licensee } from '@/types';

export default function AdviserIntelligencePage() {
  const advisers = advisersData as Adviser[];
  const licensees = licenseesData as Licensee[];
  return (
    <div>
      <PageHeader
        title="Adviser & Licensee Intelligence"
        subtitle={`${advisers.length.toLocaleString()} advisers · ${licensees.length} licensees`}
        source="ASIC Financial Adviser Register"
        asAtDate="31 March 2024"
        actions={<ExportButton entity="advisers" />}
      />
      <AdviserIntelligenceClient advisers={advisers} licensees={licensees} />
    </div>
  );
}
