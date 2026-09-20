import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  addMonths,
  subMonths,
  format,
} from 'date-fns';
import { fr } from 'date-fns/locale';

export type PeriodPreset = 'day' | 'week' | 'month' | 'quarter' | 'half-year' | 'year' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

/** Libellé "Septembre 2026" pour un couple (mois 1-12, année) */
export function formatMonthLabel(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  const label = format(date, 'MMMM yyyy', { locale: fr });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getMonthRange(month: number, year: number): DateRange {
  const date = new Date(year, month - 1, 1);
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function shiftMonth(month: number, year: number, delta: number): { month: number; year: number } {
  const shifted = delta > 0 ? addMonths(new Date(year, month - 1, 1), delta) : subMonths(new Date(year, month - 1, 1), -delta);
  return { month: shifted.getMonth() + 1, year: shifted.getFullYear() };
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/** Convertit un preset de période en plage de dates concrète, ancrée sur `reference`. */
export function resolvePeriod(preset: PeriodPreset, reference: Date, custom?: DateRange): DateRange {
  switch (preset) {
    case 'day':
      return { start: startOfDay(reference), end: endOfDay(reference) };
    case 'week':
      return { start: startOfWeek(reference, { weekStartsOn: 1 }), end: endOfWeek(reference, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(reference), end: endOfMonth(reference) };
    case 'quarter':
      return { start: startOfMonth(subMonths(reference, 2)), end: endOfMonth(reference) };
    case 'half-year':
      return { start: startOfMonth(subMonths(reference, 5)), end: endOfMonth(reference) };
    case 'year':
      return { start: startOfYear(reference), end: endOfYear(reference) };
    case 'custom':
      if (!custom) throw new Error('Plage personnalisée manquante');
      return custom;
  }
}

export function formatDateFr(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: fr });
}

export function formatDateShortFr(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: fr });
}
