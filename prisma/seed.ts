import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES: { name: string; icon: string; type: 'income' | 'expense' | 'both' }[] = [
  { name: 'Logement', icon: 'home', type: 'expense' },
  { name: 'Alimentation', icon: 'shopping-cart', type: 'expense' },
  { name: 'Transport', icon: 'car', type: 'expense' },
  { name: 'Loisirs', icon: 'gamepad-2', type: 'expense' },
  { name: 'Abonnements', icon: 'repeat', type: 'expense' },
  { name: 'Shopping', icon: 'shopping-bag', type: 'expense' },
  { name: 'Santé', icon: 'heart-pulse', type: 'expense' },
  { name: 'Éducation', icon: 'graduation-cap', type: 'expense' },
  { name: 'Voyages', icon: 'plane', type: 'expense' },
  { name: 'Factures', icon: 'receipt', type: 'expense' },
  { name: 'Restaurants', icon: 'utensils', type: 'expense' },
  { name: 'Salaire', icon: 'wallet', type: 'income' },
  { name: 'Freelance', icon: 'laptop', type: 'income' },
  { name: 'Investissement', icon: 'trending-up', type: 'income' },
  { name: 'Autres', icon: 'more-horizontal', type: 'both' },
];

async function main() {
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, isDefault: true },
    });
    if (!existing) {
      await prisma.category.create({
        data: { ...cat, isDefault: true },
      });
    }
  }

  console.log('Seed terminé : catégories par défaut et réglages initialisés.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
