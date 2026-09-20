'use client';

import { useState } from 'react';
import type { Category } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BudgetSummary } from '@/lib/budget';

interface BudgetEditorProps {
  month: number;
  year: number;
  summary: BudgetSummary;
  expenseCategories: Category[];
  onSaved: () => void;
  onCancel: () => void;
}

export function BudgetEditor({
  month,
  year,
  summary,
  expenseCategories,
  onSaved,
  onCancel,
}: BudgetEditorProps) {
  const categoryBudgetMap = new Map(
    summary.categories.filter((c) => c.budgetCents !== null).map((c) => [c.categoryId, c.budgetCents!])
  );

  const [overall, setOverall] = useState(
    summary.overallCents !== null ? (summary.overallCents / 100).toFixed(2).replace('.', ',') : ''
  );
  const [categoryAmounts, setCategoryAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      expenseCategories.map((cat) => [
        cat.id,
        categoryBudgetMap.has(cat.id)
          ? (categoryBudgetMap.get(cat.id)! / 100).toFixed(2).replace('.', ',')
          : '',
      ])
    )
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const categories = expenseCategories
        .map((cat) => {
          const raw = categoryAmounts[cat.id]?.trim();
          if (!raw) return null;
          const amount = Number(raw.replace(',', '.'));
          if (Number.isNaN(amount) || amount <= 0) return null;
          return { categoryId: cat.id, amount };
        })
        .filter(Boolean) as { categoryId: string; amount: number }[];

      const overallRaw = overall.trim();
      const overallAmount = overallRaw ? Number(overallRaw.replace(',', '.')) : null;
      if (overallRaw && (Number.isNaN(overallAmount) || overallAmount! < 0)) {
        throw new Error('Budget global invalide');
      }

      const res = await fetch('/api/budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, overallAmount, categories }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Impossible d\'enregistrer le budget');
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="overall">Budget global du mois (€)</Label>
        <Input
          id="overall"
          inputMode="decimal"
          placeholder="Ex. 2 000,00"
          value={overall}
          onChange={(e) => setOverall(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted">Optionnel — somme maximale de dépenses pour ce mois.</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Budget par catégorie</p>
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-border p-3">
          {expenseCategories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3">
              <Label htmlFor={`cat-${cat.id}`} className="min-w-[8rem] shrink-0 font-normal">
                {cat.name}
              </Label>
              <Input
                id={`cat-${cat.id}`}
                inputMode="decimal"
                placeholder="—"
                className="h-8"
                value={categoryAmounts[cat.id] ?? ''}
                onChange={(e) =>
                  setCategoryAmounts((prev) => ({ ...prev, [cat.id]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">
          Laissez vide les catégories sans plafond. Chaque mois conserve sa propre configuration.
        </p>
      </div>

      {error && <p className="text-sm text-clay">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement…' : 'Enregistrer le budget'}
        </Button>
      </div>
    </form>
  );
}
