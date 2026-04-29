'use client';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#1a35cc', '#2e52e9', '#5a7af9', '#8fa8ff', '#c0d0ff', '#e0e9ff', '#0a1140', '#182487'];

export function MarketCharts({ snapshot, timeSeries }: { snapshot: any; timeSeries: any[] }) {
  const adviserTS = timeSeries.find((t: any) => t.metric === 'Total Advisers');
  const revenueTS = timeSeries.find((t: any) => t.metric === 'Industry Revenue');
  const penTS = timeSeries.find((t: any) => t.metric === 'Advice Penetration Rate');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Adviser Count Trend */}
      <div className="bg-white rounded-lg border p-5">
        <h3 className="text-sm font-semibold mb-1">Licensed Adviser Count</h3>
        <p className="text-xs text-muted-foreground mb-4">Source: ASIC Financial Adviser Register</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={adviserTS?.dataPoints ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tickFormatter={d => d.substring(0, 4)} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'Advisers']} labelFormatter={d => d} />
            <Line type="monotone" dataKey="value" stroke="#1a35cc" strokeWidth={2} dot={{ r: 4 }} name="Advisers" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-lg border p-5">
        <h3 className="text-sm font-semibold mb-1">Industry Revenue</h3>
        <p className="text-xs text-muted-foreground mb-4">Source: IBISWorld FIN3340 (AUD billions)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueTS?.dataPoints ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tickFormatter={d => d.substring(0, 4)} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `$${v}B`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => [`$${v}B`, 'Revenue']} />
            <Bar dataKey="value" fill="#2e52e9" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* State Distribution */}
      <div className="bg-white rounded-lg border p-5">
        <h3 className="text-sm font-semibold mb-1">Advisers by State</h3>
        <p className="text-xs text-muted-foreground mb-4">Source: ASIC Financial Adviser Register</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={snapshot.byState} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="state" tick={{ fontSize: 11 }} width={35} />
            <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'Advisers']} />
            <Bar dataKey="adviserCount" fill="#5a7af9" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Channel Breakdown */}
      <div className="bg-white rounded-lg border p-5">
        <h3 className="text-sm font-semibold mb-1">Adviser Channel Mix</h3>
        <p className="text-xs text-muted-foreground mb-4">Source: ASIC Financial Adviser Register</p>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <ResponsiveContainer width="100%" height={200} className="max-w-[220px]">
            <PieChart>
              <Pie data={snapshot.byChannel} dataKey="adviserCount" nameKey="channel"
                cx="50%" cy="50%" outerRadius={85} innerRadius={48}>
                {snapshot.byChannel.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'Advisers']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 flex-1">
            {snapshot.byChannel.map((c: any, i: number) => (
              <div key={c.channel} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-foreground font-medium">{c.channel}</span>
                <span className="text-muted-foreground ml-auto">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Penetration Rate */}
      <div className="bg-white rounded-lg border p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold mb-1">Advice Penetration Rate</h3>
        <p className="text-xs text-muted-foreground mb-4">Source: Adviser Ratings Australian Advice Landscape 2025 (% adults using a financial adviser)</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={penTS?.dataPoints ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tickFormatter={d => d.substring(0, 4)} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `${v}%`} domain={[10, 16]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => [`${v}%`, 'Penetration']} />
            <Line type="monotone" dataKey="value" stroke="#1a35cc" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
