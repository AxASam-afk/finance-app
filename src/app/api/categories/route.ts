import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const categoryInputSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(60),
  icon: z.string().max(60).optional().nullable(),
  type: z.enum(['income', 'expense', 'both']).default('both'),
});

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = categoryInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Catégorie invalide', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const category = await prisma.category.create({ data: parsed.data });
  return NextResponse.json(category, { status: 201 });
}
