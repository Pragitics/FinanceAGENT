import type { WatchlistItem } from "@financeagent/shared";

import { BaseViewModel } from "./BaseViewModel";
import { FinanceService, SymbolSuggestion } from "@/services/FinanceService";

type WatchlistState = {
  loading: boolean;
  items: WatchlistItem[];
  error: string | null;
  message: string | null;
  suggestions: SymbolSuggestion[];
  submitting: boolean;
};

export class WatchlistViewModel extends BaseViewModel<WatchlistState> {
  constructor(private readonly financeService: FinanceService) {
    super({
      loading: false,
      items: [],
      error: null,
      message: null,
      suggestions: [],
      submitting: false,
    });
  }

  async initialize(): Promise<void> {
    if (this.state.loading) {
      return;
    }
    this.setState({ loading: true, error: null });
    try {
      const items = await this.financeService.getWatchlist();
      this.setState({ items });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load watchlist.";
      this.setState({ error: message });
    } finally {
      this.setState({ loading: false });
    }
  }

  async addSymbol(symbol: string): Promise<boolean> {
    if (this.state.submitting) {
      return false;
    }
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) {
      this.setState({ message: "Symbol is required." });
      return false;
    }
    this.setState({ submitting: true, message: null, error: null });
    try {
      const item = await this.financeService.addWatchlistSymbol(normalized);
      const exists = this.state.items.some((entry) => entry.id === item.id);
      this.setState({
        items: exists ? this.state.items : [...this.state.items, item].sort((a, b) => a.symbol.localeCompare(b.symbol)),
        message: "Added to watchlist.",
        suggestions: [],
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add symbol.";
      this.setState({ error: message, message: null });
      return false;
    } finally {
      this.setState({ submitting: false });
    }
  }

  async removeSymbol(symbol: string): Promise<void> {
    this.setState({ error: null });
    try {
      await this.financeService.removeWatchlistSymbol(symbol);
      this.setState({ items: this.state.items.filter((item) => item.symbol !== symbol) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove symbol.";
      this.setState({ error: message });
    }
  }

  async searchSymbols(query: string, signal?: AbortSignal): Promise<void> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      this.setState({ suggestions: [] });
      return;
    }
    const suggestions = await this.financeService.searchSymbols(trimmed, signal);
    this.setState({ suggestions });
  }
}
