import { PageHeader } from '@/components/layout/PageHeader';
import { GeographicClient } from '@/components/geographic/GeographicClient';
import geoData from '@/data/mock/geographic.json';

export default function GeographicPage() {
  return (
    <div>
      <PageHeader
        title="Geographic Intelligence"
        subtitle="Adviser density, white-space opportunity, and regional distribution"
        source="ASIC Financial Adviser Register / ABS"
        asAtDate="31 March 2024"
      />
      <GeographicClient regions={geoData as any[]} />
    </div>
  );
}
