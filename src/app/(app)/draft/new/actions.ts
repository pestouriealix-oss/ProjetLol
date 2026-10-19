"use server";

import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { CoachError, type CoachErrorKind } from "@/lib/coach/errors";
import { loadLiveDraft } from "@/lib/coach/live-draft";
import { readDraftFromScreenshot, SCREENSHOT_TYPES } from "@/lib/coach/read-draft";
import { ROLES } from "@/lib/config";
import { attemptKey, isRateLimited, recordAttempt } from "@/lib/db/auth-attempts";
import type { Draft } from "@/lib/draft/draft";
import { LlmError } from "@/lib/llm";
import { RiotApiError } from "@/lib/riot";

export type ReadScreenshotError = CoachErrorKind | "bad_image" | "too_many";

export type ReadScreenshotResult =
  { ok: true; draft: Draft; unrecognized: number } | { ok: false; error: ReadScreenshotError };

/** L'image est réduite dans le navigateur avant l'envoi : au-delà, ce n'est plus une capture. */
const MAX_BYTES = 950_000;
/** Lectures de capture par utilisateur et par heure. */
const READS_PER_HOUR = { max: 30, windowSeconds: 3600 };

const inputSchema = z.object({
  capture: z
    .instanceof(File)
    .refine((file) => file.size > 0 && file.size <= MAX_BYTES)
    .refine((file) => (SCREENSHOT_TYPES as readonly string[]).includes(file.type)),
  myRole: z.enum(ROLES),
});

/** Lit une capture de la sélection des champions (ou de l'écran de chargement). */
export async function readScreenshot(formData: FormData): Promise<ReadScreenshotResult> {
  const user = await requireUser();

  const parsed = inputSchema.safeParse({
    capture: formData.get("capture"),
    myRole: formData.get("myRole"),
  });
  if (!parsed.success) return { ok: false, error: "bad_image" };
  const { capture, myRole } = parsed.data;

  const key = attemptKey("draft-read", user.id);
  if (await isRateLimited(key, READS_PER_HOUR.max)) return { ok: false, error: "too_many" };
  await recordAttempt(key, READS_PER_HOUR.windowSeconds);

  try {
    const data = Buffer.from(await capture.arrayBuffer()).toString("base64");
    const result = await readDraftFromScreenshot(
      { data, mediaType: capture.type as (typeof SCREENSHOT_TYPES)[number] },
      myRole,
      user.id,
    );
    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof CoachError || error instanceof LlmError) {
      if (error.kind !== "not_a_draft") console.error("Lecture de capture impossible", error);
      return { ok: false, error: error.kind };
    }
    console.error("Lecture de capture impossible", error);
    return { ok: false, error: "unavailable" };
  }
}

export type LiveDraftError = CoachErrorKind | "riot_unavailable" | "too_many";

export type LoadLiveDraftResult =
  | { ok: true; status: "found"; draft: Draft; riotId: string }
  | { ok: true; status: "not_in_game" | "no_account" }
  | { ok: false; error: LiveDraftError };

/** Vérifications de la partie en cours par utilisateur et par heure (une toutes les 10 s au plus). */
const LIVE_CHECKS_PER_HOUR = { max: 400, windowSeconds: 3600 };

/** La draft de la partie en cours, lue chez Riot dès l'écran de chargement. */
export async function loadLiveGameDraft(): Promise<LoadLiveDraftResult> {
  const user = await requireUser();

  const key = attemptKey("draft-live", user.id);
  if (await isRateLimited(key, LIVE_CHECKS_PER_HOUR.max)) return { ok: false, error: "too_many" };
  await recordAttempt(key, LIVE_CHECKS_PER_HOUR.windowSeconds);

  try {
    const result = await loadLiveDraft(user.id);
    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof CoachError) return { ok: false, error: error.kind };
    console.error("Partie en cours illisible", error);
    return { ok: false, error: error instanceof RiotApiError ? "riot_unavailable" : "unavailable" };
  }
}
