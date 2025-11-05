import { redirect } from "next/navigation";

import { getAuthToken } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  if (await getAuthToken()) {
    redirect("/");
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10">
      <RegisterForm />
    </main>
  );
}
