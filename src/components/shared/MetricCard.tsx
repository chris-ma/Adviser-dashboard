import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  source?: string;
  asAtDate?: string;
  methodology?: string;
  trend?: 'up' | 'down' | 'flat';
  trendPositive?: boolean;
  className?: string;
}

export function MetricCard({
  label, value, delta, deltaLabel, source, asAtDate, methodology, trend, trendPositive = true, className,
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'flat' ? 'text-muted-foreground'
    : (trend === 'up') === trendPositive ? 'text-green-600' : 'text-red-500';

  return (
    <div className={cn('bg-white rounded-lg border p-4', className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        {methodology && (
          <span title={methodology} className="cursor-help">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      {(delta !== undefined || deltaLabel) && (
        <div className={cn('flex items-center gap-1 mt-1 text-xs', trendColor)}>
          {trend && <TrendIcon className="w-3.5 h-3.5" />}
          {delta !== undefined && <span>{delta > 0 ? '+' : ''}{delta}%</span>}
          {deltaLabel && <span className="text-muted-foreground">{deltaLabel}</span>}
        </div>
      )}
      {(source || asAtDate) && (
        <p className="text-[10px] text-muted-foreground mt-2 border-t pt-2">
          {source}{source && asAtDate ? ' · ' : ''}{asAtDate}
        </p>
      )}
    </div>
  );
}
