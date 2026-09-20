import Link from 'next/link';
import { getCurrentMonthYear } from '@/lib/dates';
import { getMonthSummary, getRecentTransactions } from '@/lib/dashboard';
import { processAllRecurringRules } from '@/lib/recurrence-engine';
import { formatMoney, formatSignedMoney, centsToPercent } from '@/lib/money';
import { formatDateShortFr } from '@/lib/dates';
import { MonthSwitcher } from '@/components/dashboard/MonthSwitcher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const current = getCurrentMonthYear();
  const month = searchParams.month ? Number(searchParams.month) : current.month;
  const year = searchParams.year ? Number(searchParams.year) : current.year;

  await processAllRecurringRules();

  const [summary, recent] = await Promise.all([getMonthSummary(month, year), getRecentTransactions()]);

  const budgetPercent =
    summary.budgetOverallCents && summary.budgetSpentCents !== null
      ? centsToPercent(summary.budgetSpentCents, summary.budgetOverallCents)
      : null;
  const budgetRemainingCents =
    summary.budgetOverallCents !== null && summary.budgetSpentCents !== null
      ? summary.budgetOverallCents - summary.budgetSpentCents
      : null;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <MonthSwitcher month={month} year={year} />
        <Button asChild size="sm">
          <Link href="/transactions?new=1">
            <Plus className="h-4 w-4" />
            Ajouter une transaction
          </Link>
        </Button>
      </div>

      {/* Bandeau "ledger" : le solde porte l'attention, les autres chiffres sont des repères secondaires */}
      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Solde actuel</p>
        <p className="tabular mt-1 text-5xl font-semibold tracking-tight">{formatMoney(summary.balanceCents)}</p>

        <dl className="mt-6 grid grid-cols-2 divide-x divide-border border-y border-border sm:grid-cols-4">
          <div className="px-4 py-4 first:pl-0">
            <dt className="text-xs text-muted">Revenus</dt>
            <dd className="tabular mt-1 text-lg font-medium text-jade">
              {formatSignedMoney(summary.incomeCents, 'INCOME')}
            </dd>
          </div>
          <div className="px-4 py-4">
            <dt className="text-xs text-muted">Dépenses</dt>
            <dd className="tabular mt-1 text-lg font-medium text-clay">
              {formatSignedMoney(summary.expensesCents, 'EXPENSE')}
            </dd>
          </div>
          <div className="px-4 py-4">
            <dt className="text-xs text-muted">Budget restant</dt>
            <dd className="tabular mt-1 text-lg font-medium">
              {budgetRemainingCents !== null ? formatMoney(budgetRemainingCents) : '—'}
            </dd>
          </div>
          <div className="px-4 py-4 sm:pr-0">
            <dt className="text-xs text-muted">Budget utilisé</dt>
            <dd className="tabular mt-1 text-lg font-medium">{budgetPercent !== null ? `${budgetPercent} %` : '—'}</dd>
          </div>
        </dl>
        {summary.budgetOverallCents === null && (
          <p className="mt-3 text-sm text-muted">
            Aucun budget n&rsquo;est configuré pour ce mois.{' '}
            <Link href="/budget" className="text-jade underline underline-offset-2">
              Configurer un budget
            </Link>
          </p>
        )}
      </section>

      {/* Transactions récentes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">Transactions récentes</h2>
          <Link href="/transactions" className="text-sm text-jade underline underline-offset-2">
            Tout voir
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-5 py-10 text-center">
            <p className="text-sm text-muted">Aucune transaction pour le moment.</p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/transactions?new=1">Ajoutez votre première dépense pour commencer</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted">
                      {formatDateShortFr(t.date)}
                      {t.category ? ` · ${t.category.name}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {t.isRecurring && (
                    <Badge tone="sand" className="hidden sm:inline-flex">
                      Récurrent
                    </Badge>
                  )}
                  <span
                    className={`tabular text-sm font-medium ${t.type === 'INCOME' ? 'text-jade' : 'text-clay'}`}
                  >
                    {formatSignedMoney(t.amountCents, t.type)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
