"use server";

import { revalidatePath } from "next/cache";

import { addWatchlistSymbol, removeWatchlistSymbol } from "@/lib/api";

export async function addSymbolAction(symbol: string) {
  const value = symbol.trim().toUpperCase();
  if (!value) {
    return { success: false, message: "Symbol is required" };
  }
  try {
    await addWatchlistSymbol(value);
    revalidatePath("/watchlist");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add symbol";
    return { success: false, message };
  }
}

export async function deleteSymbol(symbol: string) {
  await removeWatchlistSymbol(symbol);
  revalidatePath("/watchlist");
  revalidatePath("/");
}
