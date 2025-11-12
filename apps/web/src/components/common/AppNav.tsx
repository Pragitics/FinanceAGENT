import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export function AppNav() {
  const location = useLocation();
  const { token, logout } = useAuth();

  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/watchlist", label: "Watchlist" },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-950/40 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between text-sm text-slate-300">
        <Link to="/" className="font-semibold text-white">
          FinanceAGENT
        </Link>
        {token ? (
          <div className="flex items-center gap-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={location.pathname === link.to ? "text-white" : "hover:text-white"}
              >
                {link.label}
              </Link>
            ))}
            <Button type="button" variant="outline" className="px-3 py-1 text-xs" onClick={logout}>
              Sign out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="hover:text-white">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-white">
              Create account
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
