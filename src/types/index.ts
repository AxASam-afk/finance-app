import type { Category, RecurringTransaction, Transaction } from '@prisma/client';

export type TransactionWithCategory = Transaction & {
  category: Category | null;
};

export type RecurringWithCategory = RecurringTransaction & {
  category: Category | null;
  nextOccurrence: Date | null;
};

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardSummary {
  month: number;
  year: number;
  balanceCents: number;
  incomeCents: number;
  expensesCents: number;
  savingsCents: number;
  budgetOverallCents: number | null;
  budgetRemainingCents: number | null;
}
