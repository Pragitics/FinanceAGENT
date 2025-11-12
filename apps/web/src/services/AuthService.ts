import { ApiClient } from "./ApiClient";

type TokenResponse = {
  access_token: string;
  token_type: string;
};

export class AuthService {
  constructor(private readonly api: ApiClient) {}

  async login(username: string, password: string): Promise<string> {
    const data = await this.api.request<TokenResponse>("/auth/login", {
      method: "POST",
      body: { username, password },
      auth: false,
    });
    return data.access_token;
  }

  async register(username: string, password: string): Promise<string> {
    const data = await this.api.request<TokenResponse>("/auth/register", {
      method: "POST",
      body: { username, password },
      auth: false,
    });
    return data.access_token;
  }
}
