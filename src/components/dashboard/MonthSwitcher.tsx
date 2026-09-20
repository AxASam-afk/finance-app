import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthLabel, shiftMonth } from '@/lib/dates';

export function MonthSwitcher({
  month,
  year,
  basePath = '/',
}: {
  month: number;
  year: number;
  basePath?: string;
}) {
  const prev = shiftMonth(month, year, -1);
  const next = shiftMonth(month, year, 1);

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`${basePath}?month=${prev.month}&year=${prev.year}`}
        className="rounded-sm p-1.5 text-muted hover:bg-surface hover:text-ink"
        aria-label="Mois précédent"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <span className="min-w-[10ch] text-center text-sm font-medium">{formatMonthLabel(month, year)}</span>
      <Link
        href={`${basePath}?month=${next.month}&year=${next.year}`}
        className="rounded-sm p-1.5 text-muted hover:bg-surface hover:text-ink"
        aria-label="Mois suivant"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
