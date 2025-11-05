"use server";

import type { RankResponse, Recommendation, WatchlistItem } from "@financeagent/shared";

import { getAuthToken } from "@/lib/auth";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type FetchOptions = {
  auth?: boolean;
};

async function fetchJson<T>(path: string, init?: RequestInit, options?: FetchOptions): Promise<T> {
  const { auth = true } = options ?? {};
  const headers = new Headers({
    "Content-Type": "application/json",
  });
  if (init?.headers) {
    const custom = init.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : init.headers;
    Object.entries(custom as Record<string, string>).forEach(([key, value]) => headers.set(key, value));
  }
  if (auth) {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("UNAUTHENTICATED");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function getTodayRankings(): Promise<RankResponse> {
  try {
    return await fetchJson<RankResponse>("/rank/today");
  } catch (error) {
    console.warn("Failed to load rankings", error);
    return [];
  }
}

export async function getTodayRecommendation(): Promise<Recommendation> {
  try {
    return await fetchJson<Recommendation>("/recommend/today");
  } catch (error) {
    console.warn("Failed to load recommendation", error);
    return {
      symbol: null,
      reason: "Run analysis to generate a pick.",
      huge_correction: false,
      created_at: null,
    };
  }
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  try {
    return await fetchJson<WatchlistItem[]>("/watchlist");
  } catch (error) {
    console.warn("Failed to load watchlist", error);
    return [];
  }
}

export async function addWatchlistSymbol(symbol: string): Promise<WatchlistItem | null> {
  try {
    return await fetchJson<WatchlistItem>("/watchlist", {
      method: "POST",
      body: JSON.stringify({ symbol }),
    });
  } catch (error) {
    console.error("Failed to add watchlist item", error);
    throw error;
  }
}

export type SymbolSuggestion = {
  symbol: string;
  full_symbol: string;
  name?: string | null;
  exchange?: string | null;
  quote_type?: string | null;
};

export async function searchSymbols(query: string): Promise<SymbolSuggestion[]> {
  try {
    return await fetchJson<SymbolSuggestion[]>(
      `/symbols?q=${encodeURIComponent(query)}`,
      undefined,
      { auth: false }
    );
  } catch (error) {
    console.error("Failed to search symbols", error);
    return [];
  }
}

export async function removeWatchlistSymbol(symbol: string): Promise<boolean> {
  try {
    await fetchJson<void>(`/watchlist/${symbol}`, { method: "DELETE" });
    return true;
  } catch (error) {
    console.error("Failed to remove watchlist item", error);
    return false;
  }
}

export async function runDailyPipeline(): Promise<{ ranked: number; last_updated: string | null }> {
  return fetchJson<{ ranked: number; last_updated: string | null }>("/run/daily", { method: "POST" });
}
