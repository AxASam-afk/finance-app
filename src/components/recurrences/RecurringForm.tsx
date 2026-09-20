'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Category, RecurringTransaction } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z
  .object({
    amount: z
      .string()
      .min(1, 'Le montant est requis')
      .refine((v) => !Number.isNaN(Number(v.replace(',', '.'))) && Number(v.replace(',', '.')) > 0, {
        message: 'Le montant doit être un nombre supérieur à 0',
      }),
    type: z.enum(['INCOME', 'EXPENSE']),
    name: z.string().min(1, 'Le nom est requis').max(120),
    categoryId: z.string().optional(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM']),
    customRuleDay: z.string().optional(),
    startDate: z.string().min(1, 'La date de début est requise'),
    endDate: z.string().optional(),
    paymentMethod: z.string().optional(),
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.frequency === 'CUSTOM' && !data.customRuleDay) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Jour du mois requis', path: ['customRuleDay'] });
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface RecurringFormProps {
  initial?: RecurringTransaction | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function RecurringForm({ initial, onSaved, onCancel }: RecurringFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: initial ? (initial.amountCents / 100).toFixed(2).replace('.', ',') : '',
      type: initial?.type ?? 'EXPENSE',
      name: initial?.name ?? '',
      categoryId: initial?.categoryId ?? undefined,
      frequency: initial?.frequency ?? 'MONTHLY',
      customRuleDay: initial?.customRuleDay?.toString() ?? '',
      startDate: initial
        ? new Date(initial.startDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      endDate: initial?.endDate ? new Date(initial.endDate).toISOString().slice(0, 10) : '',
      paymentMethod: initial?.paymentMethod ?? '',
      isActive: initial?.isActive ?? true,
    },
  });

  const frequency = watch('frequency');

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        amount: Number(values.amount.replace(',', '.')),
        type: values.type,
        name: values.name,
        categoryId: values.categoryId || null,
        frequency: values.frequency,
        customRuleDay: values.frequency === 'CUSTOM' ? Number(values.customRuleDay) : null,
        startDate: values.startDate,
        endDate: values.endDate || null,
        paymentMethod: values.paymentMethod || null,
        isActive: values.isActive,
      };

      const res = await fetch(initial ? `/api/recurrences/${initial.id}` : '/api/recurrences', {
        method: initial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Impossible d'enregistrer la récurrence");
      }

      onSaved();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="type">Type</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Dépense</SelectItem>
                  <SelectItem value="INCOME">Revenu</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="amount">Montant (€)</Label>
          <Input id="amount" inputMode="decimal" placeholder="0,00" {...register('amount')} />
          {errors.amount && <p className="mt-1 text-xs text-clay">{errors.amount.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="name">Nom</Label>
        <Input id="name" placeholder="Ex. Loyer, Netflix, Salaire…" {...register('name')} />
        {errors.name && <p className="mt-1 text-xs text-clay">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="frequency">Fréquence</Label>
          <Controller
            control={control}
            name="frequency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Quotidien</SelectItem>
                  <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                  <SelectItem value="MONTHLY">Mensuel</SelectItem>
                  <SelectItem value="YEARLY">Annuel</SelectItem>
                  <SelectItem value="CUSTOM">Personnalisé (jour du mois)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {frequency === 'CUSTOM' && (
          <div>
            <Label htmlFor="customRuleDay">Jour du mois</Label>
            <Input id="customRuleDay" type="number" min={1} max={31} {...register('customRuleDay')} />
            {errors.customRuleDay && (
              <p className="mt-1 text-xs text-clay">{errors.customRuleDay.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="categoryId">Catégorie</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="paymentMethod">Moyen de paiement</Label>
          <Input id="paymentMethod" placeholder="Ex. Prélèvement, Virement…" {...register('paymentMethod')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="startDate">Date de début</Label>
          <Input id="startDate" type="date" {...register('startDate')} />
          {errors.startDate && <p className="mt-1 text-xs text-clay">{errors.startDate.message}</p>}
        </div>
        <div>
          <Label htmlFor="endDate">Date de fin (optionnel)</Label>
          <Input id="endDate" type="date" {...register('endDate')} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <input
              id="isActive"
              type="checkbox"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
          )}
        />
        <Label htmlFor="isActive" className="cursor-pointer font-normal">
          Récurrence active
        </Label>
      </div>

      {submitError && <p className="text-sm text-clay">{submitError}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
