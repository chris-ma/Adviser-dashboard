'use client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function LicenseeGrowthChart({ history }: { history: Array<{ date: string; count: number }> }) {
  const first = history[0]?.count ?? 0;
  const last = history[history.length - 1]?.count ?? 0;
  const color = last >= first ? '#16a34a' : '#dc2626';

  return (
    <div className="bg-white rounded-lg border p-5">
      <h3 className="text-sm font-semibold mb-1">Adviser Count Trend</h3>
      <p className="text-xs text-muted-foreground mb-3">Source: ASIC Register</p>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={history}>
          <XAxis dataKey="date" tickFormatter={d => d.substring(0, 4)} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v: any) => [v, 'Advisers']} />
          <Area type="monotone" dataKey="count" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
