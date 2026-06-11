import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEFAULT_CURRENCY = { code: "GHS", symbol: "GH₵" };

export function formatCurrency(
  amount: number | string | null | undefined,
  code = DEFAULT_CURRENCY.code,
  symbol = DEFAULT_CURRENCY.symbol
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  try {
    const formatted = new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
    }).format(num);
    // Replace whatever symbol Intl generated with the configured one
    return formatted.replace(/^[A-Z₵$€£¥₦]+\s?/, symbol + " ");
  } catch {
    // Fallback for unrecognised currency codes
    return `${symbol} ${num.toFixed(2)}`;
  }
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function generateNumber(prefix: string, count: number): string {
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(4, "0");
  return `${prefix}-${year}-${seq}`;
}
