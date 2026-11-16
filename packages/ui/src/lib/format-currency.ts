/** Symboles d'affichage des devises (codes ISO → symbole usuel). */
const CURRENCY_SYMBOLS: Record<string, string> = {
  XAF: "FCFA",
  XOF: "FCFA",
};

/** Retourne le symbole d'affichage d'une devise (FCFA par défaut). */
export function currencySymbol(currency?: string | null): string {
  if (!currency) return "FCFA";
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency;
}

/**
 * Formate un montant avec le symbole de la devise.
 * Ex. formatCurrency(1250000, "XAF") → "1 250 000 FCFA"
 */
export function formatCurrency(
  amount: number | string,
  currency?: string | null,
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const formatted = Number.isFinite(num)
    ? num.toLocaleString("fr-FR")
    : String(amount);
  return `${formatted} ${currencySymbol(currency)}`;
}
