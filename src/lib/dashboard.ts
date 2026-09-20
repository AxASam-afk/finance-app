import { prisma } from '@/lib/prisma';
import { getMonthRange } from '@/lib/dates';

export interface MonthSummary {
  month: number;
  year: number;
  incomeCents: number;
  expensesCents: number;
  balanceCents: number; // solde total du compte (toutes transactions confondues), pas seulement le mois
  budgetOverallCents: number | null;
  budgetSpentCents: number | null;
}

/**
 * Le solde est TOUJOURS recalculé depuis `Settings.initialBalanceCents` + la somme
 * de toutes les transactions non supprimées (pas seulement celles du mois affiché).
 * Revenus/dépenses du mois, eux, sont bornés à la période sélectionnée.
 */
export async function getMonthSummary(month: number, year: number): Promise<MonthSummary> {
  const { start, end } = getMonthRange(month, year);

  const [settings, monthAgg, allTimeAgg, budget] = await Promise.all([
    prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { deletedAt: null, date: { gte: start, lte: end } },
      _sum: { amountCents: true },
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { deletedAt: null },
      _sum: { amountCents: true },
    }),
    prisma.budget.findUnique({ where: { month_year: { month, year } } }),
  ]);

  const monthIncome = monthAgg.find((a) => a.type === 'INCOME')?._sum.amountCents ?? 0;
  const monthExpenses = monthAgg.find((a) => a.type === 'EXPENSE')?._sum.amountCents ?? 0;
  const allTimeIncome = allTimeAgg.find((a) => a.type === 'INCOME')?._sum.amountCents ?? 0;
  const allTimeExpenses = allTimeAgg.find((a) => a.type === 'EXPENSE')?._sum.amountCents ?? 0;

  const balanceCents = settings.initialBalanceCents + allTimeIncome - allTimeExpenses;

  return {
    month,
    year,
    incomeCents: monthIncome,
    expensesCents: monthExpenses,
    balanceCents,
    budgetOverallCents: budget?.overallCents ?? null,
    budgetSpentCents: budget ? monthExpenses : null,
  };
}

export async function getRecentTransactions(limit = 6) {
  return prisma.transaction.findMany({
    where: { deletedAt: null },
    include: { category: true },
    orderBy: { date: 'desc' },
    take: limit,
  });
}
