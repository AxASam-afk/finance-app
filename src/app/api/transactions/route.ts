import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { transactionFilterSchema, transactionInputSchema } from '@/lib/validations/transaction';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = transactionFilterSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Paramètres de recherche invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const f = parsed.data;

  const where: Prisma.TransactionWhereInput = {
    deletedAt: f.includeDeleted ? undefined : null,
    type: f.type,
    categoryId: f.categoryId,
    paymentMethod: f.paymentMethod,
    isRecurring: f.isRecurring,
    date: {
      gte: f.dateFrom,
      lte: f.dateTo,
    },
    amountCents: {
      gte: f.amountMin !== undefined ? Math.round(f.amountMin * 100) : undefined,
      lte: f.amountMax !== undefined ? Math.round(f.amountMax * 100) : undefined,
    },
    OR: f.search
      ? [
          { name: { contains: f.search, mode: 'insensitive' } },
          { description: { contains: f.search, mode: 'insensitive' } },
          { note: { contains: f.search, mode: 'insensitive' } },
          { paymentMethod: { contains: f.search, mode: 'insensitive' } },
        ]
      : undefined,
  };

  const orderBy: Prisma.TransactionOrderByWithRelationInput =
    f.sortBy === 'amount'
      ? { amountCents: f.sortDir }
      : f.sortBy === 'name'
        ? { name: f.sortDir }
        : { date: f.sortDir };

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page: f.page,
    pageSize: f.pageSize,
    totalPages: Math.max(1, Math.ceil(total / f.pageSize)),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = transactionInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Transaction invalide', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { amount, ...rest } = parsed.data;

  const transaction = await prisma.transaction.create({
    data: {
      ...rest,
      amountCents: Math.round(amount * 100),
    },
    include: { category: true },
  });

  return NextResponse.json(transaction, { status: 201 });
}
