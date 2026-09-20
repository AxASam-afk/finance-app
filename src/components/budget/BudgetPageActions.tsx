'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Category } from '@prisma/client';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BudgetEditor } from '@/components/budget/BudgetEditor';
import type { BudgetSummary } from '@/lib/budget';
import { cn } from '@/lib/utils';

interface BudgetPageActionsProps {
  month: number;
  year: number;
  summary: BudgetSummary;
  expenseCategories: Category[];
  variant?: 'primary' | 'outline';
  className?: string;
  label?: string;
}

export function BudgetPageActions({
  month,
  year,
  summary,
  expenseCategories,
  variant = 'primary',
  className,
  label,
}: BudgetPageActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSaved = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button
        size="sm"
        variant={variant === 'outline' ? 'outline' : undefined}
        className={cn(className)}
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-4 w-4" />
        {label ?? (summary.hasBudget ? 'Modifier le budget' : 'Configurer le budget')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Budget du mois</DialogTitle>
            <DialogDescription>
              Les modifications ne s&rsquo;appliquent qu&rsquo;à ce mois précis.
            </DialogDescription>
          </DialogHeader>
          <BudgetEditor
            month={month}
            year={year}
            summary={summary}
            expenseCategories={expenseCategories}
            onSaved={handleSaved}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
