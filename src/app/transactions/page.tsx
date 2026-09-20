'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { formatSignedMoney } from '@/lib/money';
import { formatDateShortFr } from '@/lib/dates';
import type { TransactionWithCategory, PaginatedResult } from '@/types';

function TransactionsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResult<TransactionWithCategory> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  const [showTrash, setShowTrash] = useState(false);
  const [formOpen, setFormOpen] = useState(searchParams.get('new') === '1');
  const [editing, setEditing] = useState<TransactionWithCategory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TransactionWithCategory | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (type !== 'all') params.set('type', type);
    if (showTrash) params.set('includeDeleted', 'true');
    const res = await fetch(`/api/transactions?${params.toString()}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [search, type, showTrash]);

  useEffect(() => {
    load();
  }, [load]);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    if (searchParams.get('new')) router.replace('/transactions');
  };

  const handleSaved = () => {
    closeForm();
    load();
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await fetch(`/api/transactions/${pendingDelete.id}`, { method: 'DELETE' });
    setPendingDelete(null);
    load();
  };

  const handleRestore = async (id: string) => {
    await fetch(`/api/transactions/${id}/restore`, { method: 'POST' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Ajouter une transaction
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Rechercher une transaction…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="INCOME">Revenus</SelectItem>
            <SelectItem value="EXPENSE">Dépenses</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={showTrash ? 'primary' : 'outline'} size="sm" onClick={() => setShowTrash((v) => !v)}>
          Corbeille
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-5 py-10 text-center">
          <p className="text-sm text-muted">
            {showTrash ? 'La corbeille est vide.' : 'Aucune transaction ne correspond à votre recherche.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {data.items.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="truncate text-xs text-muted">
                  {formatDateShortFr(new Date(t.date))}
                  {t.category ? ` · ${t.category.name}` : ''}
                  {t.paymentMethod ? ` · ${t.paymentMethod}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {t.isRecurring && (
                  <Badge tone="sand" className="hidden sm:inline-flex">
                    Récurrent
                  </Badge>
                )}
                <span className={`tabular text-sm font-medium ${t.type === 'INCOME' ? 'text-jade' : 'text-clay'}`}>
                  {formatSignedMoney(t.amountCents, t.type)}
                </span>
                {t.deletedAt ? (
                  <Button variant="ghost" size="icon" aria-label="Restaurer" onClick={() => handleRestore(t.id)}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Modifier"
                      onClick={() => {
                        setEditing(t);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Supprimer"
                      onClick={() => setPendingDelete(t)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la transaction' : 'Ajouter une transaction'}</DialogTitle>
            <DialogDescription>Formulaire de saisie d&rsquo;une transaction</DialogDescription>
          </DialogHeader>
          <TransactionForm initial={editing} onSaved={handleSaved} onCancel={closeForm} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer cette transaction ?</DialogTitle>
            <DialogDescription>Confirmation de suppression</DialogDescription>
          </DialogHeader>
          {pendingDelete && (
            <p className="text-sm text-muted">
              {pendingDelete.name} — {formatSignedMoney(pendingDelete.amountCents, pendingDelete.type)} du{' '}
              {formatDateShortFr(new Date(pendingDelete.date))}. Elle sera déplacée vers la corbeille et pourra être
              restaurée.
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
      <TransactionsPageInner />
    </Suspense>
  );
}
