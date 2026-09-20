import type { Category } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getMonthRange } from '@/lib/dates';

export type BudgetStatus = 'ok' | 'warning' | 'exceeded' | 'none';

const WARNING_THRESHOLD = 0.8;

export function getBudgetStatus(spentCents: number, budgetCents: number | null): BudgetStatus {
  if (budgetCents === null || budgetCents <= 0) return 'none';
  const ratio = spentCents / budgetCents;
  if (ratio >= 1) return 'exceeded';
  if (ratio >= WARNING_THRESHOLD) return 'warning';
  return 'ok';
}

export interface BudgetCategoryLine {
  categoryId: string;
  category: Category;
  budgetCents: number | null;
  spentCents: number;
  remainingCents: number | null;
  percentUsed: number | null;
  status: BudgetStatus;
}

export interface BudgetSummary {
  month: number;
  year: number;
  overallCents: number | null;
  overallSpentCents: number;
  overallRemainingCents: number | null;
  overallPercentUsed: number | null;
  overallStatus: BudgetStatus;
  categories: BudgetCategoryLine[];
  hasBudget: boolean;
}

export async function getBudgetSummary(month: number, year: number): Promise<BudgetSummary> {
  const { start, end } = getMonthRange(month, year);

  const [budget, spentByCategory, totalExpenses] = await Promise.all([
    prisma.budget.findUnique({
      where: { month_year: { month, year } },
      include: {
        categories: { include: { category: true } },
      },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        deletedAt: null,
        type: 'EXPENSE',
        date: { gte: start, lte: end },
        categoryId: { not: null },
      },
      _sum: { amountCents: true },
    }),
    prisma.transaction.aggregate({
      where: {
        deletedAt: null,
        type: 'EXPENSE',
        date: { gte: start, lte: end },
      },
      _sum: { amountCents: true },
    }),
  ]);

  const spentMap = new Map(
    spentByCategory.map((row) => [row.categoryId!, row._sum.amountCents ?? 0])
  );
  const overallSpentCents = totalExpenses._sum.amountCents ?? 0;

  const budgetCategoryMap = new Map(
    budget?.categories.map((bc) => [bc.categoryId, bc.amountCents]) ?? []
  );

  const expenseCategories = await prisma.category.findMany({
    where: { type: { in: ['expense', 'both'] } },
    orderBy: { name: 'asc' },
  });

  const categoryLines: BudgetCategoryLine[] = expenseCategories.map((category) => {
    const budgetCents = budgetCategoryMap.get(category.id) ?? null;
    const spentCents = spentMap.get(category.id) ?? 0;
    const remainingCents = budgetCents !== null ? budgetCents - spentCents : null;
    const percentUsed =
      budgetCents !== null && budgetCents > 0 ? Math.round((spentCents / budgetCents) * 1000) / 10 : null;

    return {
      categoryId: category.id,
      category,
      budgetCents,
      spentCents,
      remainingCents,
      percentUsed,
      status: getBudgetStatus(spentCents, budgetCents),
    };
  });

  const overallCents = budget?.overallCents ?? null;
  const overallRemainingCents = overallCents !== null ? overallCents - overallSpentCents : null;
  const overallPercentUsed =
    overallCents !== null && overallCents > 0
      ? Math.round((overallSpentCents / overallCents) * 1000) / 10
      : null;

  return {
    month,
    year,
    overallCents,
    overallSpentCents,
    overallRemainingCents,
    overallPercentUsed,
    overallStatus: getBudgetStatus(overallSpentCents, overallCents),
    categories: categoryLines.filter((line) => line.budgetCents !== null || line.spentCents > 0),
    hasBudget: !!budget && (budget.overallCents !== null || budget.categories.length > 0),
  };
}

export interface UpsertBudgetInput {
  month: number;
  year: number;
  overallCents: number | null;
  categories: { categoryId: string; amountCents: number }[];
}

/** Crée ou met à jour le budget d'un mois donné — n'affecte jamais les autres mois. */
export async function upsertBudget(input: UpsertBudgetInput) {
  const { month, year, overallCents, categories } = input;

  return prisma.$transaction(async (tx) => {
    const budget = await tx.budget.upsert({
      where: { month_year: { month, year } },
      create: { month, year, overallCents },
      update: { overallCents },
    });

    await tx.budgetCategory.deleteMany({ where: { budgetId: budget.id } });

    if (categories.length > 0) {
      await tx.budgetCategory.createMany({
        data: categories.map((c) => ({
          budgetId: budget.id,
          categoryId: c.categoryId,
          amountCents: c.amountCents,
        })),
      });
    }

    return tx.budget.findUniqueOrThrow({
      where: { id: budget.id },
      include: { categories: { include: { category: true } } },
    });
  });
}
