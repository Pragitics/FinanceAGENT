import { appConfig } from "@/core/config";
import { getStoredToken } from "@/core/tokenStorage";

type RequestOptions = {
  auth?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  body?: unknown;
  method?: string;
};

export class ApiClient {
  constructor(private readonly getToken: () => string | null = getStoredToken) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { auth = true, body, method = "GET", signal, headers = {} } = options;
    const mergedHeaders = new Headers({
      "Content-Type": "application/json",
      ...headers,
    });

    if (auth) {
      const token = this.getToken();
      if (!token) {
        throw new Error("UNAUTHENTICATED");
      }
      mergedHeaders.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${appConfig.apiUrl}${path}`, {
      method,
      headers: mergedHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed (${response.status})`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
}
