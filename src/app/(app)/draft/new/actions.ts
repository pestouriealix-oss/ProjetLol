"use server";

import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { CoachError, type CoachErrorKind } from "@/lib/coach/errors";
import { readDraftFromScreenshot, SCREENSHOT_TYPES } from "@/lib/coach/read-draft";
import { ROLES } from "@/lib/config";
import { attemptKey, isRateLimited, recordAttempt } from "@/lib/db/auth-attempts";
import type { Draft } from "@/lib/draft/draft";
import { LlmError } from "@/lib/llm";

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
