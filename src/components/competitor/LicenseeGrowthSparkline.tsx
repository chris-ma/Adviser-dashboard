'use client';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export function LicenseeGrowthSparkline({ history }: { history: Array<{ date: string; count: number }> }) {
  if (!history?.length) return null;
  const first = history[0].count;
  const last = history[history.length - 1].count;
  const color = last >= first ? '#16a34a' : '#dc2626';
  return (
    <div style={{ width: 80, height: 32 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
          <Line type="monotone" dataKey="count" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
