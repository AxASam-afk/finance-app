import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 });
  }
  if (!existing.deletedAt) {
    return NextResponse.json({ error: "Transaction n'est pas dans la corbeille" }, { status: 409 });
  }

  const transaction = await prisma.transaction.update({
    where: { id: params.id },
    data: { deletedAt: null },
  });

  return NextResponse.json(transaction);
}
