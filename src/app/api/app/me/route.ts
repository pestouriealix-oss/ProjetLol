import { requireAppUser } from "@/lib/auth/app-session";
import { canUseCoach } from "@/lib/auth/email-flows";
import { remainingSheets } from "@/lib/coach/sheet";
import { appJson, appPreflight, appUnauthorized } from "@/lib/companion/http";
import { listRiotAccounts } from "@/lib/db/riot-accounts";

export const OPTIONS = appPreflight;

/** Ce que la fenêtre de bureau de l'app affiche : le compte, l'offre, les fiches restantes. */
export async function GET(request: Request) {
  const auth = await requireAppUser(request);
  if (!auth) return appUnauthorized();
  const { user } = auth;

  const [accounts, sheets] = await Promise.all([
    listRiotAccounts(user.id),
    remainingSheets(user.id, user.plan),
  ]);
  return appJson(200, {
    name: user.name,
    plan: user.plan,
    founder: user.founder,
    trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
    coachReady: canUseCoach(user),
    sheets: { limit: sheets.limit, remaining: sheets.remaining },
    accounts: accounts.map((account) => ({
      gameName: account.gameName,
      tagLine: account.tagLine,
      platform: account.platform,
      primary: account.isPrimary,
      owned: account.ownedAt !== null,
    })),
  });
}
