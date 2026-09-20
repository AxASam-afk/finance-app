import { NextRequest, NextResponse } from 'next/server';
import { getBudgetSummary, upsertBudget } from '@/lib/budget';
import { budgetInputSchema, budgetQuerySchema } from '@/lib/validations/budget';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = budgetQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Paramètres invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const summary = await getBudgetSummary(parsed.data.month, parsed.data.year);
  return NextResponse.json(summary);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const parsed = budgetInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Budget invalide', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { month, year, overallAmount, categories } = parsed.data;

  const budget = await upsertBudget({
    month,
    year,
    overallCents: overallAmount !== undefined && overallAmount !== null ? Math.round(overallAmount * 100) : null,
    categories: categories.map((c) => ({
      categoryId: c.categoryId,
      amountCents: Math.round(c.amount * 100),
    })),
  });

  const summary = await getBudgetSummary(month, year);
  return NextResponse.json({ budget, summary });
}
