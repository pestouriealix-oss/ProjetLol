import { requireAppUser } from "@/lib/auth/app-session";
import { draftSheetResponse } from "@/lib/coach/sheet-response";
import { appPreflight, appUnauthorized, CORS_HEADERS } from "@/lib/companion/http";

export const OPTIONS = appPreflight;

/** La fiche de draft pour l'app, diffusée comme sur le site (mêmes quotas, même coach). */
export async function POST(request: Request) {
  const auth = await requireAppUser(request);
  if (!auth) return appUnauthorized();
  return draftSheetResponse(auth.user, request, CORS_HEADERS);
}
