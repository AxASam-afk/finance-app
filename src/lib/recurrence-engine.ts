import { endOfDay, startOfDay } from 'date-fns';
import type { RecurringTransaction } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getOccurrencesInRange } from '@/lib/recurrence';

export interface ProcessResult {
  ruleId: string;
  created: number;
  skipped: number;
}

/**
 * Génère les transactions manquantes pour une règle récurrente, jusqu'à `upTo` inclus.
 * Idempotent : une occurrence = au plus une transaction non supprimée par jour calendaire.
 * Les transactions déjà générées ne sont jamais modifiées par une mise à jour de règle.
 */
export async function processRecurringRule(
  rule: RecurringTransaction,
  upTo: Date = new Date()
): Promise<ProcessResult> {
  if (!rule.isActive) {
    return { ruleId: rule.id, created: 0, skipped: 0 };
  }

  const rangeEnd = endOfDay(upTo);
  const occurrences = getOccurrencesInRange(rule, rule.startDate, rangeEnd);

  let created = 0;
  let skipped = 0;

  for (const occurrence of occurrences) {
    const dayStart = startOfDay(occurrence);
    const dayEnd = endOfDay(occurrence);

    const existing = await prisma.transaction.findFirst({
      where: {
        recurringTransactionId: rule.id,
        deletedAt: null,
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.transaction.create({
      data: {
        amountCents: rule.amountCents,
        type: rule.type,
        name: rule.name,
        description: rule.description,
        categoryId: rule.categoryId,
        date: dayStart,
        paymentMethod: rule.paymentMethod,
        isRecurring: true,
        recurringTransactionId: rule.id,
      },
    });
    created += 1;
  }

  return { ruleId: rule.id, created, skipped };
}

/** Traite toutes les règles actives et retourne un résumé. */
export async function processAllRecurringRules(upTo: Date = new Date()): Promise<ProcessResult[]> {
  const rules = await prisma.recurringTransaction.findMany({ where: { isActive: true } });
  const results: ProcessResult[] = [];

  for (const rule of rules) {
    results.push(await processRecurringRule(rule, upTo));
  }

  return results;
}
