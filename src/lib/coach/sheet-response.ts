import "server-only";
import { z } from "zod";

import { canUseCoach } from "@/lib/auth/email-flows";
import { CoachError } from "@/lib/coach/errors";
import { remainingSheets, writeDraftSheet } from "@/lib/coach/sheet";
import { freeCoachPaused } from "@/lib/coach/usage";
import type { CurrentUser } from "@/lib/db/users";
import { draftSchema } from "@/lib/draft/draft";
import { llm, LlmError } from "@/lib/llm";

/**
 * Écrit une fiche de draft et la diffuse au fur et à mesure, une ligne JSON
 * par événement (NDJSON) :
 * - `{ type: "facts", facts }` : les données vérifiées utilisées (statistiques, Data Dragon) ;
 * - `{ type: "partial", sheet }` : la fiche en cours d'écriture ;
 * - `{ type: "done", id, sheet, facts }` : la fiche finale, enregistrée ;
 * - `{ type: "error", error }` : la raison de l'échec (voir CoachErrorKind).
 */

const bodySchema = z.object({ draft: draftSchema });

/**
 * Partagé par le site (`/api/draft/sheet`, session) et l'app Overwolf
 * (`/api/app/sheet`, jeton) : l'appelant a déjà authentifié `user`. `headers`
 * s'ajoute à chaque réponse (CORS pour l'app).
 */
export async function draftSheetResponse(
  user: CurrentUser,
  request: Request,
  headers: Record<string, string> = {},
): Promise<Response> {
  const json = (status: number, body: unknown) =>
    Response.json(body, { status, headers: { ...headers, "Cache-Control": "no-store" } });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return json(400, { type: "error", error: "invalid_draft" });
  }
  if (!llm.isConfigured) return json(503, { type: "error", error: "missing_key" });
  if (!canUseCoach(user)) return json(403, { type: "error", error: "email_unverified" });

  // Plafond mensuel du site atteint : les fiches gratuites attendent le mois suivant.
  if (await freeCoachPaused(user.plan)) return json(429, { type: "error", error: "budget" });

  const { remaining } = await remainingSheets(user.id, user.plan);
  if (remaining <= 0) return json(429, { type: "error", error: "quota" });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const { id, sheet, facts } = await writeDraftSheet(
          user.id,
          body.draft,
          (partial) => send({ type: "partial", sheet: partial }),
          request.signal,
          (facts) => send({ type: "facts", facts }),
        );
        send({ type: "done", id, sheet, facts });
      } catch (error) {
        const kind =
          error instanceof CoachError || error instanceof LlmError ? error.kind : "unavailable";
        if (!request.signal.aborted) console.error("Fiche de draft impossible", error);
        send({ type: "error", error: kind });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...headers,
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
