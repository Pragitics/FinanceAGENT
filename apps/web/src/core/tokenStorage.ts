const TOKEN_KEY = "financeagent_token";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredToken(): string | null {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
}
