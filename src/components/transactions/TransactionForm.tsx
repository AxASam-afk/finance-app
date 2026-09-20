'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Category, Transaction } from '@prisma/client';

const formSchema = z.object({
  amount: z
    .string()
    .min(1, 'Le montant est requis')
    .refine((v) => !Number.isNaN(Number(v.replace(',', '.'))) && Number(v.replace(',', '.')) > 0, {
      message: 'Le montant doit être un nombre supérieur à 0',
    }),
  type: z.enum(['INCOME', 'EXPENSE']),
  name: z.string().min(1, 'Le nom est requis').max(120),
  categoryId: z.string().optional(),
  date: z.string().min(1, 'La date est requise'),
  paymentMethod: z.string().optional(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  initial?: Transaction | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function TransactionForm({ initial, onSaved, onCancel }: TransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: initial ? (initial.amountCents / 100).toFixed(2).replace('.', ',') : '',
      type: initial?.type ?? 'EXPENSE',
      name: initial?.name ?? '',
      categoryId: initial?.categoryId ?? undefined,
      date: initial ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      paymentMethod: initial?.paymentMethod ?? '',
      note: initial?.note ?? '',
    },
  });

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
        date: values.date,
        paymentMethod: values.paymentMethod || null,
        note: values.note || null,
      };

      const res = await fetch(initial ? `/api/transactions/${initial.id}` : '/api/transactions', {
        method: initial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Impossible d'enregistrer la transaction");
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
        <Input id="name" placeholder="Ex. Carrefour, Loyer, Salaire…" {...register('name')} />
        {errors.name && <p className="mt-1 text-xs text-clay">{errors.name.message}</p>}
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
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && <p className="mt-1 text-xs text-clay">{errors.date.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="paymentMethod">Moyen de paiement</Label>
        <Input id="paymentMethod" placeholder="Ex. Carte, Espèces, Virement…" {...register('paymentMethod')} />
      </div>

      <div>
        <Label htmlFor="note">Note (optionnel)</Label>
        <Input id="note" {...register('note')} />
      </div>

      {submitError && <p className="text-sm text-clay">{submitError}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </div>
    </form>
  );
}
