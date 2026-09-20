import Link from 'next/link';
import { getCurrentMonthYear } from '@/lib/dates';
import { getBudgetSummary } from '@/lib/budget';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { MonthSwitcher } from '@/components/dashboard/MonthSwitcher';
import { BudgetStatusBar } from '@/components/budget/BudgetStatusBar';
import { BudgetPageActions } from '@/components/budget/BudgetPageActions';
import { Badge } from '@/components/ui/badge';

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const current = getCurrentMonthYear();
  const month = searchParams.month ? Number(searchParams.month) : current.month;
  const year = searchParams.year ? Number(searchParams.year) : current.year;

  const [summary, expenseCategories] = await Promise.all([
    getBudgetSummary(month, year),
    prisma.category.findMany({
      where: { type: { in: ['expense', 'both'] } },
      orderBy: { name: 'asc' },
    }),
  ]);

  const linesWithBudget = summary.categories.filter((line) => line.budgetCents !== null);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Budget mensuel</h1>
          <p className="mt-1 text-sm text-muted">
            Configuration propre à ce mois — les mois passés ne sont jamais modifiés rétroactivement.
          </p>
        </div>
        <BudgetPageActions
          month={month}
          year={year}
          summary={summary}
          expenseCategories={expenseCategories}
        />
      </div>

      <MonthSwitcher month={month} year={year} basePath="/budget" />

      {!summary.hasBudget ? (
        <div className="rounded-md border border-dashed border-border px-5 py-10 text-center">
          <p className="text-sm text-muted">Aucun budget configuré pour ce mois.</p>
          <BudgetPageActions
            month={month}
            year={year}
            summary={summary}
            expenseCategories={expenseCategories}
            variant="outline"
            className="mt-3"
            label="Configurer le budget"
          />
        </div>
      ) : (
        <>
          {summary.overallCents !== null && (
            <section className="rounded-md border border-border bg-paper p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Budget global</p>
                  <p className="tabular mt-1 text-2xl font-semibold">{formatMoney(summary.overallCents)}</p>
                </div>
                <Badge
                  tone={
                    summary.overallStatus === 'exceeded'
                      ? 'clay'
                      : summary.overallStatus === 'warning'
                        ? 'sand'
                        : 'jade'
                  }
                >
                  {summary.overallPercentUsed !== null ? `${summary.overallPercentUsed} %` : '—'}
                </Badge>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-muted">Dépensé</dt>
                  <dd className="tabular font-medium text-clay">{formatMoney(summary.overallSpentCents)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Restant</dt>
                  <dd className="tabular font-medium">
                    {summary.overallRemainingCents !== null
                      ? formatMoney(summary.overallRemainingCents)
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Statut</dt>
                  <dd className="font-medium">
                    {summary.overallStatus === 'exceeded'
                      ? 'Dépassé'
                      : summary.overallStatus === 'warning'
                        ? 'Proche limite'
                        : 'OK'}
                  </dd>
                </div>
              </dl>
              <BudgetStatusBar
                className="mt-4"
                percentUsed={summary.overallPercentUsed}
                status={summary.overallStatus}
              />
            </section>
          )}

          {linesWithBudget.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted">Par catégorie</h2>
              <ul className="divide-y divide-border rounded-md border border-border">
                {linesWithBudget.map((line) => (
                  <li key={line.categoryId} className="space-y-2 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{line.category.name}</p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="tabular text-muted">
                          {formatMoney(line.spentCents)} / {formatMoney(line.budgetCents!)}
                        </span>
                        {line.percentUsed !== null && (
                          <Badge
                            tone={
                              line.status === 'exceeded'
                                ? 'clay'
                                : line.status === 'warning'
                                  ? 'sand'
                                  : 'jade'
                            }
                          >
                            {line.percentUsed} %
                          </Badge>
                        )}
                      </div>
                    </div>
                    <BudgetStatusBar percentUsed={line.percentUsed} status={line.status} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <p className="text-sm text-muted">
        Les montants « dépensés » proviennent des{' '}
        <Link href="/transactions" className="text-jade underline underline-offset-2">
          transactions réelles
        </Link>{' '}
        du mois — pas des prévisionnels.
      </p>
    </div>
  );
}
