import "server-only";

/**
 * Réponses de l'API de l'app Overwolf (`/api/app/*`).
 *
 * L'app appelle depuis son origine « overwolf-extension://… » : le navigateur
 * exige donc des en-têtes CORS. Toute origine est acceptée parce que l'accès
 * passe par un jeton dans l'en-tête `Authorization`, jamais par un cookie : un
 * autre site ne peut rien faire au nom du joueur sans ce jeton.
 */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

export function appJson(status: number, body: unknown): Response {
  return Response.json(body, {
    status,
    headers: { ...CORS_HEADERS, "Cache-Control": "no-store" },
  });
}

/** Réponse à la question préalable du navigateur (requête OPTIONS). */
export function appPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** Jeton absent, inconnu ou révoqué : l'app doit se relier à nouveau. */
export const appUnauthorized = () => appJson(401, { error: "unauthorized" });
