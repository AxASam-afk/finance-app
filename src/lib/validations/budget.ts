import { z } from 'zod';

export const budgetCategoryInputSchema = z.object({
  categoryId: z.string().cuid(),
  amount: z
    .number({ invalid_type_error: 'Montant invalide' })
    .positive('Le montant doit être supérieur à 0')
    .max(10_000_000),
});

export const budgetInputSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  overallAmount: z
    .number()
    .nonnegative('Le budget global ne peut pas être négatif')
    .max(10_000_000)
    .optional()
    .nullable(),
  categories: z.array(budgetCategoryInputSchema).optional().default([]),
});

export type BudgetInput = z.infer<typeof budgetInputSchema>;

export const budgetQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
