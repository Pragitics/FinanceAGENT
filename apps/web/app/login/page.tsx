import { redirect } from "next/navigation";

import { getAuthToken } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await getAuthToken()) {
    redirect("/");
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10">
      <LoginForm />
    </main>
  );
}
