import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

import { LogoutButton } from "@/components/LogoutButton";
import { getAuthToken } from "@/lib/auth";

export const metadata: Metadata = {
  title: "FinanceAGENT",
  description: "Value investing assistant",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const token = await getAuthToken();
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-background pb-16">
          <nav className="border-b border-slate-800 bg-slate-950/40 px-6 py-4 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between text-sm text-slate-300">
              <Link href="/" className="font-semibold text-white">
                FinanceAGENT
              </Link>
              {token ? (
                <div className="flex items-center gap-3">
                  <Link href="/" className="hover:text-white">
                    Dashboard
                  </Link>
                  <Link href="/watchlist" className="hover:text-white">
                    Watchlist
                  </Link>
                  <LogoutButton />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="hover:text-white">
                    Sign in
                  </Link>
                  <Link href="/register" className="hover:text-white">
                    Create account
                  </Link>
                </div>
              )}
            </div>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
