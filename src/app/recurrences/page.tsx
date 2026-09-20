'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Pause, Play, Search } from 'lucide-react';
import type { RecurringTransaction } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RecurringForm } from '@/components/recurrences/RecurringForm';
import { formatSignedMoney } from '@/lib/money';
import { formatDateShortFr } from '@/lib/dates';
import { FREQUENCY_LABELS } from '@/lib/recurrence';
import type { RecurringWithCategory } from '@/types';

export default function RecurrencesPage() {
  const [items, setItems] = useState<RecurringWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecurringWithCategory | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter === 'active') params.set('isActive', 'true');
    if (statusFilter === 'inactive') params.set('isActive', 'false');
    const res = await fetch(`/api/recurrences?${params.toString()}`);
    const json = await res.json();
    setItems(
      (json.items ?? []).map((item: RecurringWithCategory & { nextOccurrence?: string | null }) => ({
        ...item,
        nextOccurrence: item.nextOccurrence ? new Date(item.nextOccurrence) : null,
      }))
    );
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSaved = () => {
    closeForm();
    load();
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await fetch(`/api/recurrences/${pendingDelete.id}`, { method: 'DELETE' });
    setPendingDelete(null);
    load();
  };

  const toggleActive = async (rule: RecurringWithCategory) => {
    await fetch(`/api/recurrences/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Récurrences</h1>
          <p className="mt-1 text-sm text-muted">
            Les transactions sont générées automatiquement à chaque échéance, sans modifier l&rsquo;historique déjà
            créé.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nouvelle récurrence
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Rechercher…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="inactive">Inactives</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-5 py-10 text-center">
          <p className="text-sm text-muted">Aucune récurrence configurée.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setFormOpen(true)}>
            Créer votre première récurrence
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {items.map((rule) => (
            <li key={rule.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{rule.name}</p>
                  <Badge tone={rule.isActive ? 'jade' : 'sand'}>{rule.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="truncate text-xs text-muted">
                  {FREQUENCY_LABELS[rule.frequency]}
                  {rule.category ? ` · ${rule.category.name}` : ''}
                  {rule.nextOccurrence
                    ? ` · Prochaine : ${formatDateShortFr(rule.nextOccurrence)}`
                    : rule.isActive
                      ? ' · Aucune échéance à venir'
                      : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`tabular text-sm font-medium ${rule.type === 'INCOME' ? 'text-jade' : 'text-clay'}`}>
                  {formatSignedMoney(rule.amountCents, rule.type)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={rule.isActive ? 'Désactiver' : 'Activer'}
                  onClick={() => toggleActive(rule)}
                >
                  {rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Modifier"
                  onClick={() => {
                    setEditing(rule);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Supprimer"
                  onClick={() => setPendingDelete(rule)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la récurrence' : 'Nouvelle récurrence'}</DialogTitle>
            <DialogDescription>
              Les modifications s&rsquo;appliquent aux prochaines occurrences uniquement.
            </DialogDescription>
          </DialogHeader>
          <RecurringForm initial={editing} onSaved={handleSaved} onCancel={closeForm} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer cette récurrence ?</DialogTitle>
            <DialogDescription>Confirmation de suppression</DialogDescription>
          </DialogHeader>
          {pendingDelete && (
            <p className="text-sm text-muted">
              {pendingDelete.name} — {formatSignedMoney(pendingDelete.amountCents, pendingDelete.type)}. La règle sera
              supprimée ; les transactions déjà générées restent dans l&rsquo;historique.
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
