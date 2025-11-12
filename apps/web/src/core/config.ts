const DEFAULT_API_URL = "http://localhost:8000";
const DEFAULT_KITE_REDIRECT = "http://localhost:3000/redirect";

export const appConfig = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? DEFAULT_API_URL,
  kitePublisherKey: (import.meta.env.VITE_KITE_PUBLISHER_API_KEY as string | undefined) ?? "",
  kiteRedirectUrl: (import.meta.env.VITE_KITE_REDIRECT_URL as string | undefined) ?? DEFAULT_KITE_REDIRECT,
};
