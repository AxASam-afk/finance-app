import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { transactionUpdateSchema } from '@/lib/validations/transaction';

interface Params {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
    include: { category: true },
  });

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 });
  }

  return NextResponse.json(transaction);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const parsed = transactionUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Modification invalide', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 });
  }

  const { amount, ...rest } = parsed.data;

  const transaction = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      ...rest,
      amountCents: amount !== undefined ? Math.round(amount * 100) : undefined,
    },
    include: { category: true },
  });

  return NextResponse.json(transaction);
}

/** Suppression douce : la transaction va dans la corbeille (deletedAt renseigné). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const existing = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 });
  }
  if (existing.deletedAt) {
    return NextResponse.json({ error: 'Transaction déjà dans la corbeille' }, { status: 409 });
  }

  const transaction = await prisma.transaction.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json(transaction);
}
