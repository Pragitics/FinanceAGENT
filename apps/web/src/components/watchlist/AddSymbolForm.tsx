import { useEffect, useState } from "react";

import type { SymbolSuggestion } from "@/services/FinanceService";
import { Button } from "@/components/ui/Button";

type Props = {
  pending: boolean;
  message: string | null;
  suggestions: SymbolSuggestion[];
  onSubmit: (symbol: string) => Promise<boolean>;
  onSearch: (query: string, signal: AbortSignal) => Promise<void> | void;
};

export function AddSymbolForm({ pending, message, suggestions, onSubmit, onSearch }: Props) {
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const trimmed = symbol.trim().toUpperCase();
    void onSearch(trimmed, controller.signal);
    return () => controller.abort();
  }, [symbol, onSearch]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!symbol.trim()) {
      return;
    }
    const success = await onSubmit(symbol);
    if (success) {
      setSymbol("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col text-sm">
        Symbol
        <input
          className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
          name="symbol"
          list="watchlist-suggestions"
          placeholder="INFY"
          value={symbol}
          onChange={(event) => setSymbol(event.target.value.toUpperCase())}
          required
        />
      </label>
      <datalist id="watchlist-suggestions">
        {suggestions.map((item) => {
          const value = item.full_symbol ?? item.symbol;
          return (
            <option key={`${value}-${item.exchange ?? ""}`} value={value}>
              {item.symbol}
              {item.exchange ? ` · ${item.exchange}` : ""}
              {item.name ? ` – ${item.name}` : ""}
            </option>
          );
        })}
      </datalist>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </Button>
        {message && <span className="text-xs text-slate-300">{message}</span>}
      </div>
    </form>
  );
}
