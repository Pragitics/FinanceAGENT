import { BaseViewModel } from "./BaseViewModel";
import { AuthService } from "@/services/AuthService";

export type AuthMode = "login" | "register";

type AuthFormState = {
  username: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  error: string | null;
};

export class AuthFormViewModel extends BaseViewModel<AuthFormState> {
  constructor(
    private readonly mode: AuthMode,
    private readonly authService: AuthService,
    private readonly onAuthenticated: (token: string) => void,
  ) {
    super({
      username: "",
      password: "",
      confirmPassword: "",
      loading: false,
      error: null,
    });
  }

  setUsername(value: string): void {
    this.setState({ username: value });
  }

  setPassword(value: string): void {
    this.setState({ password: value });
  }

  setConfirmPassword(value: string): void {
    this.setState({ confirmPassword: value });
  }

  async submit(): Promise<boolean> {
    const { username, password, confirmPassword } = this.state;
    if (!username || !password) {
      this.setState({ error: "Username and password are required." });
      return false;
    }
    if (this.mode === "register" && password !== confirmPassword) {
      this.setState({ error: "Passwords do not match." });
      return false;
    }
    this.setState({ loading: true, error: null });
    try {
      const token =
        this.mode === "login"
          ? await this.authService.login(username, password)
          : await this.authService.register(username, password);
      this.onAuthenticated(token);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action failed";
      this.setState({ error: message });
      return false;
    } finally {
      this.setState({ loading: false });
    }
  }
}
