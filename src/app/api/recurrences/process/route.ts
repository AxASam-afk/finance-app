import { NextResponse } from 'next/server';
import { processAllRecurringRules } from '@/lib/recurrence-engine';

/** Déclenche manuellement la génération idempotente de toutes les récurrences actives. */
export async function POST() {
  const results = await processAllRecurringRules();
  const created = results.reduce((sum, r) => sum + r.created, 0);
  const skipped = results.reduce((sum, r) => sum + r.skipped, 0);

  return NextResponse.json({ results, created, skipped });
}
