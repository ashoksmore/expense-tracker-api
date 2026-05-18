const locale = typeof navigator !== "undefined" ? navigator.language : "en-US";

const currencyFormatter = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const currencyCompact = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat(locale, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/** Short month label for chart keys (e.g. "Jan 2026") */
export function formatMonthYearLabel(date) {
  return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(date);
}

export function formatCurrency(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return currencyFormatter.format(0);
  return currencyFormatter.format(n);
}

export function formatCurrencyCompact(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return currencyCompact.format(0);
  return currencyCompact.format(n);
}

export function formatExpenseDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "—";
  return dateFormatter.format(d);
}
