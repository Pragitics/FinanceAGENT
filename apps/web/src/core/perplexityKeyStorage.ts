const PERPLEXITY_KEY = "financeagent_perplexity_key";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredPerplexityKey(): string | null {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem(PERPLEXITY_KEY);
}

export function storePerplexityKey(key: string | null): void {
  if (!isBrowser()) {
    return;
  }
  if (!key) {
    window.localStorage.removeItem(PERPLEXITY_KEY);
    return;
  }
  window.localStorage.setItem(PERPLEXITY_KEY, key);
}
