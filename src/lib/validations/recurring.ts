import { z } from 'zod';
import { transactionTypeSchema } from '@/lib/validations/transaction';

export const recurrenceFrequencySchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM']);

const recurringBaseSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Le montant doit être un nombre' })
    .positive('Le montant doit être supérieur à 0')
    .max(10_000_000, 'Montant trop élevé'),
  type: transactionTypeSchema,
  name: z.string().min(1, 'Le nom est requis').max(120),
  description: z.string().max(500).optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  frequency: recurrenceFrequencySchema,
  customRuleDay: z.number().int().min(1).max(31).optional().nullable(),
  startDate: z.coerce.date({ errorMap: () => ({ message: 'Date de début invalide' }) }),
  endDate: z.coerce.date().optional().nullable(),
  paymentMethod: z.string().max(60).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

function refineRecurringDates(data: {
  frequency?: string;
  customRuleDay?: number | null;
  startDate?: Date;
  endDate?: Date | null;
}, ctx: z.RefinementCtx) {
  if (data.frequency === 'CUSTOM' && !data.customRuleDay) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Indiquez le jour du mois pour une fréquence personnalisée',
      path: ['customRuleDay'],
    });
  }
  if (data.endDate && data.startDate && data.endDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La date de fin doit être postérieure à la date de début',
      path: ['endDate'],
    });
  }
}

export const recurringInputSchema = recurringBaseSchema.superRefine(refineRecurringDates);

export type RecurringInput = z.infer<typeof recurringInputSchema>;

export const recurringUpdateSchema = recurringBaseSchema.partial().superRefine(refineRecurringDates);

export const recurringFilterSchema = z.object({
  type: transactionTypeSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
