import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  isAfter,
  isBefore,
  startOfDay,
} from 'date-fns';
import type { RecurrenceFrequency, RecurringTransaction } from '@prisma/client';

export type RecurrenceRule = Pick<
  RecurringTransaction,
  'frequency' | 'startDate' | 'endDate' | 'customRuleDay' | 'isActive'
>;

/** Jour du mois cible pour MONTHLY / CUSTOM (clampé au dernier jour du mois). */
export function resolveDayOfMonth(year: number, month: number, dayOfMonth: number): Date {
  const lastDay = endOfMonth(new Date(year, month - 1, 1)).getDate();
  const day = Math.min(Math.max(dayOfMonth, 1), lastDay);
  return startOfDay(new Date(year, month - 1, day));
}

function getAnchorDayOfMonth(rule: RecurrenceRule): number {
  if (rule.frequency === 'CUSTOM' && rule.customRuleDay) {
    return rule.customRuleDay;
  }
  return startOfDay(rule.startDate).getDate();
}

/** Prochaine occurrence à partir de `after` (inclus), ou null si la règle est inactive / expirée. */
export function getNextOccurrence(rule: RecurrenceRule, after: Date = new Date()): Date | null {
  if (!rule.isActive) return null;

  const rangeStart = startOfDay(after);
  const ruleStart = startOfDay(rule.startDate);
  const ruleEnd = rule.endDate ? endOfDay(rule.endDate) : null;

  if (ruleEnd && isAfter(rangeStart, ruleEnd)) return null;

  const from = isBefore(rangeStart, ruleStart) ? ruleStart : rangeStart;
  const to = ruleEnd ?? addYears(from, 10);

  const occurrences = getOccurrencesInRange(rule, from, to, 1);
  return occurrences[0] ?? null;
}

/**
 * Liste les dates d'occurrence dans [rangeStart, rangeEnd].
 * `limit` permet de court-circuiter pour getNextOccurrence.
 */
export function getOccurrencesInRange(
  rule: RecurrenceRule,
  rangeStart: Date,
  rangeEnd: Date,
  limit?: number
): Date[] {
  if (!rule.isActive) return [];

  const start = startOfDay(rangeStart);
  const end = endOfDay(rangeEnd);
  const ruleStart = startOfDay(rule.startDate);
  const ruleEnd = rule.endDate ? endOfDay(rule.endDate) : null;

  if (ruleEnd && isBefore(ruleEnd, start)) return [];
  if (isAfter(ruleStart, end)) return [];

  const effectiveStart = isBefore(start, ruleStart) ? ruleStart : start;
  const effectiveEnd = ruleEnd && isBefore(ruleEnd, end) ? ruleEnd : end;

  const results: Date[] = [];
  const push = (date: Date) => {
    const d = startOfDay(date);
    if (isBefore(d, effectiveStart) || isAfter(d, effectiveEnd)) return;
    if (isBefore(d, ruleStart)) return;
    if (ruleEnd && isAfter(d, ruleEnd)) return;
    results.push(d);
  };

  switch (rule.frequency as RecurrenceFrequency) {
    case 'DAILY': {
      let cursor = effectiveStart;
      while (!isAfter(cursor, effectiveEnd)) {
        push(cursor);
        if (limit && results.length >= limit) break;
        cursor = addDays(cursor, 1);
      }
      break;
    }
    case 'WEEKLY': {
      let cursor = effectiveStart;
      const targetDow = ruleStart.getDay();
      while (cursor.getDay() !== targetDow) {
        cursor = addDays(cursor, 1);
        if (isAfter(cursor, effectiveEnd)) return results;
      }
      while (!isAfter(cursor, effectiveEnd)) {
        push(cursor);
        if (limit && results.length >= limit) break;
        cursor = addWeeks(cursor, 1);
      }
      break;
    }
    case 'MONTHLY':
    case 'CUSTOM': {
      const dom = getAnchorDayOfMonth(rule);
      let cursor = resolveDayOfMonth(effectiveStart.getFullYear(), effectiveStart.getMonth() + 1, dom);
      if (isBefore(cursor, effectiveStart)) {
        const next = addMonths(cursor, 1);
        cursor = resolveDayOfMonth(next.getFullYear(), next.getMonth() + 1, dom);
      }
      while (!isAfter(cursor, effectiveEnd)) {
        push(cursor);
        if (limit && results.length >= limit) break;
        const next = addMonths(cursor, 1);
        cursor = resolveDayOfMonth(next.getFullYear(), next.getMonth() + 1, dom);
      }
      break;
    }
    case 'YEARLY': {
      const month = ruleStart.getMonth() + 1;
      const dom = ruleStart.getDate();
      let year = effectiveStart.getFullYear();
      let cursor = resolveDayOfMonth(year, month, dom);
      if (isBefore(cursor, effectiveStart)) {
        year += 1;
        cursor = resolveDayOfMonth(year, month, dom);
      }
      while (!isAfter(cursor, effectiveEnd)) {
        push(cursor);
        if (limit && results.length >= limit) break;
        year += 1;
        cursor = resolveDayOfMonth(year, month, dom);
      }
      break;
    }
  }

  return results;
}

export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  DAILY: 'Quotidien',
  WEEKLY: 'Hebdomadaire',
  MONTHLY: 'Mensuel',
  YEARLY: 'Annuel',
  CUSTOM: 'Personnalisé (jour du mois)',
};
