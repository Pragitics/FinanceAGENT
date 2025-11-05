'use server';

import { revalidatePath } from "next/cache";

import { runDailyPipeline } from "@/lib/api";

type RunResult =
  | { success: true; lastUpdated: string | null }
  | { success: false; message: string };

export async function runAnalysis(): Promise<RunResult> {
  try {
    const result = await runDailyPipeline();
    revalidatePath("/");
    return { success: true, lastUpdated: result.last_updated };
  } catch (error) {
    console.error("Failed to run analysis", error);
    return { success: false, message: "Run failed" };
  }
}
