import type {
  RankResponse,
  Recommendation,
  WatchlistItem,
} from "@financeagent/shared";

import { ApiClient } from "./ApiClient";

export type SymbolSuggestion = {
  symbol: string;
  full_symbol: string;
  name?: string | null;
  exchange?: string | null;
  quote_type?: string | null;
};

export class FinanceService {
  constructor(private readonly api: ApiClient) {}

  async getTodayRankings(): Promise<RankResponse> {
    try {
      return await this.api.request<RankResponse>("/rank/today");
    } catch (error) {
      console.warn("Failed to load rankings", error);
      return [];
    }
  }

  async getTodayRecommendation(): Promise<Recommendation> {
    try {
      return await this.api.request<Recommendation>("/recommend/today");
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

  async runDailyPipeline(
    perplexityApiKey?: string | null,
  ): Promise<{ ranked: number; last_updated: string | null }> {
    const body =
      typeof perplexityApiKey === "string" && perplexityApiKey.trim().length > 0
        ? { perplexity_api_key: perplexityApiKey.trim() }
        : undefined;
    return this.api.request("/run/daily", {
      method: "POST",
      body,
    });
  }

  async getWatchlist(): Promise<WatchlistItem[]> {
    try {
      return await this.api.request<WatchlistItem[]>("/watchlist");
    } catch (error) {
      console.warn("Failed to load watchlist", error);
      return [];
    }
  }

  async addWatchlistSymbol(symbol: string): Promise<WatchlistItem> {
    return this.api.request("/watchlist", {
      method: "POST",
      body: { symbol },
    });
  }

  async removeWatchlistSymbol(symbol: string): Promise<void> {
    await this.api.request(`/watchlist/${symbol}`, {
      method: "DELETE",
    });
  }

  async searchSymbols(query: string, signal?: AbortSignal): Promise<SymbolSuggestion[]> {
    try {
      return await this.api.request<SymbolSuggestion[]>(
        `/symbols?q=${encodeURIComponent(query)}`,
        { auth: false, signal },
      );
    } catch (error) {
      console.warn("Symbol search failed", error);
      return [];
    }
  }
}
