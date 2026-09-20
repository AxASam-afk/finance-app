import { z } from 'zod';

export const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE']);

export const transactionInputSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Le montant doit être un nombre' })
    .positive('Le montant doit être supérieur à 0')
    .max(10_000_000, 'Montant trop élevé'),
  type: transactionTypeSchema,
  name: z.string().min(1, 'Le nom est requis').max(120),
  description: z.string().max(500).optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  date: z.coerce.date({ errorMap: () => ({ message: 'Date invalide' }) }),
  paymentMethod: z.string().max(60).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export const transactionUpdateSchema = transactionInputSchema.partial();

export const transactionFilterSchema = z.object({
  search: z.string().optional(),
  type: transactionTypeSchema.optional(),
  categoryId: z.string().optional(),
  paymentMethod: z.string().optional(),
  isRecurring: z.coerce.boolean().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
  sortBy: z.enum(['date', 'amount', 'name']).optional().default('date'),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export type TransactionFilter = z.infer<typeof transactionFilterSchema>;
