import { cn } from '@/lib/utils';
import type { AdviserStatus } from '@/types';

const config: Record<string, { label: string; classes: string }> = {
  Active: { label: 'Active', classes: 'bg-green-50 text-green-700 ring-green-600/20' },
  Suspended: { label: 'Suspended', classes: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' },
  Cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-700 ring-red-600/20' },
  Lapsed: { label: 'Lapsed', classes: 'bg-gray-100 text-gray-600 ring-gray-500/20' },
  Current: { label: 'Current', classes: 'bg-green-50 text-green-700 ring-green-600/20' },
  Enacted: { label: 'Enacted', classes: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  Consultation: { label: 'Consultation', classes: 'bg-purple-50 text-purple-700 ring-purple-600/20' },
  Proposed: { label: 'Proposed', classes: 'bg-orange-50 text-orange-700 ring-orange-600/20' },
  Monitoring: { label: 'Monitoring', classes: 'bg-gray-100 text-gray-600 ring-gray-500/20' },
};

export function StatusBadge({ status }: { status: string }) {
  const c = config[status] ?? { label: status, classes: 'bg-gray-100 text-gray-600 ring-gray-500/20' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', c.classes)}>
      {c.label}
    </span>
  );
}
