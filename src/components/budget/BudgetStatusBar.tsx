import { cn } from '@/lib/utils';
import type { BudgetStatus } from '@/lib/budget';

const STATUS_COLORS: Record<BudgetStatus, string> = {
  ok: 'bg-jade',
  warning: 'bg-sand',
  exceeded: 'bg-clay',
  none: 'bg-border',
};

const STATUS_LABELS: Record<BudgetStatus, string> = {
  ok: 'Dans les clous',
  warning: 'Proche de la limite',
  exceeded: 'Dépassé',
  none: 'Non défini',
};

export function BudgetStatusBar({
  percentUsed,
  status,
  className,
}: {
  percentUsed: number | null;
  status: BudgetStatus;
  className?: string;
}) {
  const width = percentUsed !== null ? Math.min(percentUsed, 100) : 0;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className={cn('h-full rounded-full transition-all', STATUS_COLORS[status])}
          style={{ width: `${width}%` }}
        />
      </div>
      {status !== 'none' && status !== 'ok' && (
        <p className={cn('text-xs', status === 'exceeded' ? 'text-clay' : 'text-sand')}>
          {STATUS_LABELS[status]}
          {percentUsed !== null ? ` (${percentUsed} %)` : ''}
        </p>
      )}
    </div>
  );
}
