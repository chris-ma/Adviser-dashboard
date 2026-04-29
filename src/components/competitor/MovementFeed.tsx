'use client';
import type { MovementEvent } from '@/types';
import { relativeDate } from '@/lib/utils';
import { ArrowRight, UserPlus, UserMinus, RefreshCw } from 'lucide-react';

const icons: Record<string, any> = {
  Join: UserPlus, Exit: UserMinus, Transfer: ArrowRight,
  Suspension: UserMinus, Reinstatement: UserPlus, Cancellation: UserMinus,
};
const colors: Record<string, string> = {
  Join: 'text-green-600 bg-green-50', Exit: 'text-red-500 bg-red-50',
  Transfer: 'text-blue-600 bg-blue-50', Suspension: 'text-yellow-600 bg-yellow-50',
  Reinstatement: 'text-green-600 bg-green-50', Cancellation: 'text-red-500 bg-red-50',
};

export function MovementFeed({ movements }: { movements: MovementEvent[] }) {
  return (
    <div className="space-y-3 max-h-[460px] overflow-y-auto">
      {movements.map(m => {
        const Icon = icons[m.eventType] ?? RefreshCw;
        const color = colors[m.eventType] ?? 'text-muted-foreground bg-muted';
        return (
          <div key={m.id} className="flex gap-2.5 text-xs">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
              <Icon className="w-3 h-3" />
            </div>
            <div>
              <p className="font-medium">{m.adviserName}</p>
              <p className="text-muted-foreground">{m.eventType}
                {m.toLicenseeName && ` → ${m.toLicenseeName.slice(0, 30)}`}
              </p>
              <p className="text-muted-foreground mt-0.5">{relativeDate(m.eventDate)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
