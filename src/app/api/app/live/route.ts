import { requireAppUser } from "@/lib/auth/app-session";
import { CoachError } from "@/lib/coach/errors";
import { loadLiveDraft } from "@/lib/coach/live-draft";
import { appJson, appPreflight, appUnauthorized } from "@/lib/companion/http";

export const OPTIONS = appPreflight;

/**
 * La draft de la partie en chargement (Spectator-V5), pour les comptes dont la
 * propriété est prouvée. L'app la demande à l'écran de chargement, puis
 * réessaie quelques secondes plus tard tant que Riot ne la montre pas.
 */
export async function GET(request: Request) {
  const auth = await requireAppUser(request);
  if (!auth) return appUnauthorized();

  try {
    return appJson(200, await loadLiveDraft(auth.user.id));
  } catch (error) {
    if (!(error instanceof CoachError)) console.error("Partie en cours illisible (app)", error);
    return appJson(503, { status: "unavailable" });
  }
}
