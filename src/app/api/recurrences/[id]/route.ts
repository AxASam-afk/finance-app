import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getNextOccurrence } from '@/lib/recurrence';
import { processRecurringRule } from '@/lib/recurrence-engine';
import { recurringUpdateSchema } from '@/lib/validations/recurring';

interface Params {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const rule = await prisma.recurringTransaction.findUnique({
    where: { id: params.id },
    include: { category: true },
  });

  if (!rule) {
    return NextResponse.json({ error: 'Récurrence introuvable' }, { status: 404 });
  }

  return NextResponse.json({ ...rule, nextOccurrence: getNextOccurrence(rule) });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const parsed = recurringUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Modification invalide', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.recurringTransaction.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Récurrence introuvable' }, { status: 404 });
  }

  const { amount, customRuleDay, frequency, ...rest } = parsed.data;
  const nextFrequency = frequency ?? existing.frequency;

  const rule = await prisma.recurringTransaction.update({
    where: { id: params.id },
    data: {
      ...rest,
      amountCents: amount !== undefined ? Math.round(amount * 100) : undefined,
      frequency,
      customRuleDay:
        nextFrequency === 'CUSTOM'
          ? customRuleDay ?? existing.customRuleDay
          : frequency !== undefined
            ? null
            : undefined,
    },
    include: { category: true },
  });

  if (rule.isActive) {
    await processRecurringRule(rule);
  }

  return NextResponse.json({ ...rule, nextOccurrence: getNextOccurrence(rule) });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const existing = await prisma.recurringTransaction.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Récurrence introuvable' }, { status: 404 });
  }

  await prisma.recurringTransaction.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
