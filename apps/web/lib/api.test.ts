import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getAuthToken: () => Promise.resolve("token"),
}));

import { getTodayRankings } from "@/lib/api";

describe("getTodayRankings", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    (console.warn as unknown as { mockRestore?: () => void }).mockRestore?.();
  });

  it("calls the API endpoint", async () => {
    const mockResponse = [{
      symbol: "TCS",
      opportunity_score: 2,
      price_change_pct: -1,
      last_price: 1500,
      sentiment_score: -0.2,
      rank: 1,
      headlines: [],
    }];
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockResponse });

    const result = await getTodayRankings();

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/rank/today", expect.any(Object));
    expect(result).toEqual(mockResponse);
  });

  it("returns mock data when request fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "",
    });
    const result = await getTodayRankings();
    expect(result.length).toBe(0);
  });
});
