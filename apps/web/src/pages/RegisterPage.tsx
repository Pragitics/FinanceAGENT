import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useViewModelState } from "@/hooks/useViewModel";
import { ApiClient } from "@/services/ApiClient";
import { AuthService } from "@/services/AuthService";
import { AuthFormViewModel } from "@/viewmodels/AuthFormViewModel";

export function RegisterPage() {
  const { token, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate("/", { replace: true });
    }
  }, [navigate, token]);

  const apiClient = useMemo(() => new ApiClient(() => null), []);
  const authService = useMemo(() => new AuthService(apiClient), [apiClient]);
  const viewModel = useMemo(() => new AuthFormViewModel("register", authService, login), [authService, login]);
  const state = useViewModelState(viewModel);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await viewModel.submit();
    if (success) {
      navigate("/", { replace: true });
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-950 px-6 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">Register to save your watchlist and run personalized analysis.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="flex flex-col text-sm text-slate-200">
            Username
            <input
              type="text"
              className="mt-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              value={state.username}
              onChange={(event) => viewModel.setUsername(event.target.value)}
              required
              minLength={6}
              autoComplete="username"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-200">
            Password
            <input
              type="password"
              className="mt-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              value={state.password}
              onChange={(event) => viewModel.setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-200">
            Confirm password
            <input
              type="password"
              className="mt-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              value={state.confirmPassword}
              onChange={(event) => viewModel.setConfirmPassword(event.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <Button type="submit" className="w-full" disabled={state.loading}>
            {state.loading ? "Creating account…" : "Create account"}
          </Button>
          {state.error && <p className="text-sm text-red-400">{state.error}</p>}
        </form>
        <p className="mt-6 text-xs text-slate-400">
          Already have an account?{" "}
          <button type="button" className="text-sky-300 hover:text-sky-200" onClick={() => navigate("/login")}>
            Sign in
          </button>
        </p>
      </div>
    </main>
  );
}
