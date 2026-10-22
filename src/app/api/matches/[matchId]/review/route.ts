import { requireUser } from "@/lib/auth/session";
import { remainingReviews, ReviewError, writeMatchReview } from "@/lib/coach/review";
import { freeCoachPaused } from "@/lib/coach/usage";
import { llm, LlmError } from "@/lib/llm";

/**
 * Écrit le bilan d'une partie et le diffuse au fur et à mesure, une ligne
 * JSON par événement (NDJSON) :
 * - `{ type: "facts", facts }` : les faits de la partie sur lesquels il s'appuie ;
 * - `{ type: "partial", review }` : le bilan en cours d'écriture ;
 * - `{ type: "done", id, review, facts }` : le bilan final, enregistré ;
 * - `{ type: "error", error }` : la raison de l'échec (voir ReviewErrorKind).
 */

/** Identifiant Riot d'une partie : « EUW1_7123456789 ». */
const MATCH_ID = /^[A-Z0-9]{2,5}_\d{1,15}$/;

const json = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const user = await requireUser();
  const { matchId } = await params;
  if (!MATCH_ID.test(matchId)) return json(404, { type: "error", error: "match_not_found" });
  if (!llm.isConfigured) return json(503, { type: "error", error: "missing_key" });

  if (await freeCoachPaused(user.plan)) return json(429, { type: "error", error: "budget" });
  const { remaining } = await remainingReviews(user.id, user.plan);
  if (remaining <= 0) return json(429, { type: "error", error: "quota" });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const { id, review, facts } = await writeMatchReview(
          user.id,
          matchId,
          (partial) => send({ type: "partial", review: partial }),
          request.signal,
          (facts) => send({ type: "facts", facts }),
        );
        send({ type: "done", id, review, facts });
      } catch (error) {
        const kind =
          error instanceof ReviewError || error instanceof LlmError ? error.kind : "unavailable";
        if (!request.signal.aborted) console.error("Bilan de partie impossible", error);
        send({ type: "error", error: kind });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
