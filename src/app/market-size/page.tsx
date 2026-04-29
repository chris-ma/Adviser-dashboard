import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/shared/MetricCard';
import { ExportButton } from '@/components/shared/ExportButton';
import { MarketCharts } from '@/components/market-size/MarketCharts';
import marketData from '@/data/mock/market-size.json';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function MarketSizePage() {
  const { snapshot, timeSeries } = marketData as any;
  const adviserTS = timeSeries.find((t: any) => t.metric === 'Total Advisers');
  const prevAdvisers = adviserTS?.dataPoints[adviserTS.dataPoints.length - 2]?.value ?? 0;
  const adviserDelta = Math.round(((snapshot.totalAdvisers - prevAdvisers) / prevAdvisers) * 100 * 10) / 10;

  return (
    <div>
      <PageHeader
        title="Market Size & Structure"
        subtitle="Australian financial advice industry overview"
        source="IBISWorld FIN3340 / ASIC Financial Adviser Register"
        asAtDate="31 March 2024"
        actions={<ExportButton entity="advisers" label="Export Adviser Data" />}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <MetricCard
          label="Industry Revenue"
          value={`$${snapshot.totalRevenue}B`}
          source="IBISWorld FIN3340"
          asAtDate="2024"
          methodology="Total industry revenue estimate from IBISWorld sector report FIN3340, including financial planning, investment advice and related services."
          trend="up"
          delta={1.7}
          deltaLabel="vs 2023"
          trendPositive
        />
        <MetricCard
          label="Total Businesses"
          value={formatNumber(snapshot.totalBusinesses)}
          source="IBISWorld FIN3340"
          asAtDate="2024"
          trend="flat"
        />
        <MetricCard
          label="Licensed Advisers"
          value={formatNumber(snapshot.totalAdvisers)}
          source="ASIC Register"
          asAtDate="Mar 2024"
          delta={adviserDelta}
          deltaLabel="vs Jun 2023"
          trend="down"
          trendPositive={false}
        />
        <MetricCard
          label="AFS Licensees"
          value={formatNumber(snapshot.totalLicensees)}
          source="ASIC Register"
          asAtDate="Mar 2024"
          trend="flat"
        />
        <MetricCard
          label="Penetration Rate"
          value={`${snapshot.penetrationRate}%`}
          source="Adviser Ratings 2025"
          asAtDate="2024"
          methodology="Percentage of Australian adults (18+) who currently use a financial adviser. Stable at ~12% after declining post-Royal Commission."
          trend="up"
          delta={0.3}
          deltaLabel="vs 2023"
          trendPositive
        />
        <MetricCard
          label="Avg Revenue/Business"
          value={formatCurrency(snapshot.averageRevenuePerBusiness)}
          source="IBISWorld FIN3340"
          asAtDate="2024"
          trend="up"
          trendPositive
        />
      </div>

      <MarketCharts snapshot={snapshot} timeSeries={timeSeries} />
    </div>
  );
}
