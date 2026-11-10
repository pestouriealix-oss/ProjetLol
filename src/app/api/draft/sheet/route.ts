import { requireUser } from "@/lib/auth/session";
import { draftSheetResponse } from "@/lib/coach/sheet-response";

/** Écrit une fiche de draft et la diffuse au fur et à mesure (voir `draftSheetResponse`). */
export async function POST(request: Request) {
  const user = await requireUser();
  return draftSheetResponse(user, request);
}
