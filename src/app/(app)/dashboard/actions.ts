"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { riotApi } from "@/lib/riot";
import { syncRiotAccount } from "@/lib/sync/sync-account";

const copy = t.dashboard.sync;

export type SyncState = { status: "idle" } | { status: "done" | "failed"; message: string };

const accountIdSchema = z.string().min(1).max(64);

/** Met à jour un compte Riot depuis l'API de Riot, à la demande du joueur. */
export async function syncAccountAction(accountId: string): Promise<SyncState> {
  const user = await requireUser();
  const parsedId = accountIdSchema.safeParse(accountId);
  if (!parsedId.success) return { status: "failed", message: copy.errors.account_missing };

  const result = await syncRiotAccount(user.id, parsedId.data, { api: riotApi });

  // Même après un échec, le compte a pu être vérifié ou des parties sauvées.
  revalidatePath("/dashboard");
  revalidatePath("/matches");
  revalidatePath("/settings");

  if (result.ok) {
    const message = copy.newMatches(result.newMatches);
    return { status: "done", message: result.partial ? `${message} ${copy.partial}` : message };
  }
  return {
    status: "failed",
    message:
      result.reason === "cooldown"
        ? copy.errors.cooldown(result.retryAfterSeconds ?? 60)
        : copy.errors[result.reason],
  };
}
