"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { formatCurrency, DEFAULT_CURRENCY } from "./utils";

interface CurrencyConfig {
  code: string;
  symbol: string;
}

interface CurrencyContextValue {
  currency: CurrencyConfig;
  format: (amount: number | string | null | undefined) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  format: (a) => formatCurrency(a),
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyConfig>(DEFAULT_CURRENCY);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((settings: Record<string, string>) => {
        if (settings.currency_code || settings.currency_symbol) {
          setCurrency({
            code: settings.currency_code ?? DEFAULT_CURRENCY.code,
            symbol: settings.currency_symbol ?? DEFAULT_CURRENCY.symbol,
          });
        }
      })
      .catch(() => {});
  }, []);

  const format = (amount: number | string | null | undefined) =>
    formatCurrency(amount, currency.code, currency.symbol);

  return (
    <CurrencyContext.Provider value={{ currency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
