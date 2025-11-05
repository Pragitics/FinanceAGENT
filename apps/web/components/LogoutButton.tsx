"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { logout } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(() => {
      logout()
        .catch((error) => console.error("Logout failed", error))
        .finally(() => {
          router.push("/login");
          router.refresh();
        });
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-md border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
      disabled={pending}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
