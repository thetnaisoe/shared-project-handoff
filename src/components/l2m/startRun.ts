import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { RunCreate } from "@/lib/contract";

export const MAX_WORDS = 1500;
export const countWords = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

export async function startRun(body: RunCreate): Promise<string | null> {
  try {
    const res = await api.createRun(body);
    return res.run_id;
  } catch (e) {
    toast.error(e instanceof ApiError ? e.detail : e instanceof Error ? e.message : "Could not start run");
    return null;
  }
}
