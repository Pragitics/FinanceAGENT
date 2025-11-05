export interface WatchlistCreate {
  symbol: string;
  exchange?: string | null;
}

export interface WatchlistItem extends WatchlistCreate {
  id: number;
  user_id: number;
  symbol: string;
  exchange: string;
  added_at: string;
}

export interface NewsHeadline {
  id?: number | null;
  symbol: string;
  source: string;
  headline: string;
  url: string;
  published_at: string;
  sentiment_score?: number | null;
  summary?: string | null;
  raw_json?: Record<string, unknown> | null;
}

export interface RankedSymbol {
  symbol: string;
  opportunity_score: number;
  price_change_pct: number;
  last_price?: number | null;
  sentiment_score: number;
  rank: number;
  headlines: NewsHeadline[];
  overview_summary?: string | null;
  sentiment_label?: string | null;
  overview_heading?: string | null;
}

export interface Recommendation {
  symbol: string | null;
  reason: string;
  huge_correction: boolean;
  created_at?: string | null;
}

export type RankResponse = RankedSymbol[];
