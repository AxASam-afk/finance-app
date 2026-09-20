/**
 * Toutes les sommes d'argent sont stockées et manipulées en CENTIMES (entiers)
 * pour éviter les erreurs d'arrondi en virgule flottante. On ne convertit en
 * euros décimaux qu'au moment de l'affichage ou de la saisie utilisateur.
 */

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 125050 -> "1 250,50 €" */
export function formatMoney(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** 125050 -> "1 250,50 €" avec signe +/- explicite selon le type */
export function formatSignedMoney(cents: number, type: 'INCOME' | 'EXPENSE'): string {
  const sign = type === 'INCOME' ? '+' : '−';
  return `${sign}${formatMoney(Math.abs(cents))}`;
}

/** "1250,50" ou "1250.50" ou "1 250,50 €" -> 125050 (centimes, entier) */
export function parseAmountToCents(input: string): number {
  const cleaned = input
    .replace(/[€\s]/g, '')
    .replace(/\u00A0/g, '')
    .replace(',', '.');
  const value = Number.parseFloat(cleaned);
  if (Number.isNaN(value)) {
    throw new Error('Montant invalide');
  }
  return Math.round(value * 100);
}

/** 125050 -> 1250.5 (pour affichage dans un <input type="number">) */
export function centsToDecimalString(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function centsToPercent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10; // 1 décimale
}
