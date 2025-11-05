"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const TOKEN_COOKIE = "financeagent_token";
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const COOKIE_MAX_AGE = 60 * 60; // 60 minutes

type TokenPayload = {
  access_token: string;
  token_type: string;
};

type AuthResult =
  | { success: true }
  | { success: false; message: string };

function setAuthCookie(token: string) {
  cookies().set({
    name: TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function getAuthToken(): Promise<string | null> {
  return cookies().get(TOKEN_COOKIE)?.value ?? null;
}

export async function requireAuth(): Promise<string> {
  const token = await getAuthToken();
  if (!token) {
    redirect("/login");
  }
  return token;
}

async function requestToken(path: string, payload: Record<string, unknown>): Promise<TokenPayload> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Authentication failed");
    }
    const data = (await response.json()) as TokenPayload;
    return data;
  } catch (error) {
    console.error("Auth request failed", error);
    throw error;
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const data = await requestToken("/auth/login", { email, password });
    setAuthCookie(data.access_token);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid email or password";
    return { success: false, message };
  }
}

export async function register(email: string, password: string): Promise<AuthResult> {
  try {
    const data = await requestToken("/auth/register", { email, password });
    setAuthCookie(data.access_token);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return { success: false, message };
  }
}

export async function logout(): Promise<void> {
  cookies().delete(TOKEN_COOKIE);
}
