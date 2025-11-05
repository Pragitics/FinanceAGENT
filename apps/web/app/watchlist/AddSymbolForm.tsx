"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { addSymbolAction } from "./actions";
import type { SymbolSuggestion } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function AddSymbolForm() {
  const [symbol, setSymbol] = useState("");
  const [suggestions, setSuggestions] = useState<SymbolSuggestion[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    const value = symbol.trim().toUpperCase();
    if (!value || value.length < 2) {
      setSuggestions([]);
      return () => controller.abort();
    }
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`${API_BASE}/symbols?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load suggestions");
        }
        const data = (await response.json()) as SymbolSuggestion[];
        setSuggestions(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      }
    };
    fetchSuggestions();
    return () => controller.abort();
  }, [symbol]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = symbol.trim().toUpperCase();
    if (!value) {
      setMessage("Symbol is required");
      return;
    }
    setMessage(null);
    startTransition(() => {
      addSymbolAction(value).then((result) => {
        if (result.success) {
          setSymbol("");
          setMessage("Added to watchlist");
          router.refresh();
        } else {
          setMessage(result.message);
        }
      }).catch((error) => {
        console.error("Add symbol failed", error);
        setMessage("Failed to add symbol");
      });
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
        {suggestions.map((item) => (
          <option key={`${item.symbol}-${item.exchange ?? ""}`} value={item.symbol}>
            {item.symbol}
            {item.exchange ? ` · ${item.exchange}` : ""}
            {item.name ? ` – ${item.name}` : ""}
          </option>
        ))}
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
