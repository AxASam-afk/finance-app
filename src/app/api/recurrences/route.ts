import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getNextOccurrence } from '@/lib/recurrence';
import { processAllRecurringRules, processRecurringRule } from '@/lib/recurrence-engine';
import { recurringFilterSchema, recurringInputSchema } from '@/lib/validations/recurring';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = recurringFilterSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Paramètres invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const f = parsed.data;
  const processNow = req.nextUrl.searchParams.get('process') !== 'false';

  if (processNow) {
    await processAllRecurringRules();
  }

  const where: Prisma.RecurringTransactionWhereInput = {
    type: f.type,
    isActive: f.isActive,
    OR: f.search
      ? [
          { name: { contains: f.search, mode: 'insensitive' } },
          { description: { contains: f.search, mode: 'insensitive' } },
        ]
      : undefined,
  };

  const items = await prisma.recurringTransaction.findMany({
    where,
    include: { category: true },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  });

  const enriched = items.map((rule) => ({
    ...rule,
    nextOccurrence: getNextOccurrence(rule),
  }));

  return NextResponse.json({ items: enriched });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = recurringInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Récurrence invalide', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { amount, customRuleDay, frequency, ...rest } = parsed.data;

  const rule = await prisma.recurringTransaction.create({
    data: {
      ...rest,
      amountCents: Math.round(amount * 100),
      frequency,
      customRuleDay: frequency === 'CUSTOM' ? customRuleDay : null,
    },
    include: { category: true },
  });

  if (rule.isActive) {
    await processRecurringRule(rule);
  }

  return NextResponse.json(
    { ...rule, nextOccurrence: getNextOccurrence(rule) },
    { status: 201 }
  );
}
