import { requireAppUser } from "@/lib/auth/app-session";
import { appJson, appPreflight, appUnauthorized } from "@/lib/companion/http";
import { getChampionAssets } from "@/lib/ddragon/champions";

export const OPTIONS = appPreflight;

/**
 * Les champions du patch (numéro, identifiant, nom français, portrait Data
 * Dragon), pour nommer le champion choisi pendant la sélection.
 */
export async function GET(request: Request) {
  const auth = await requireAppUser(request);
  if (!auth) return appUnauthorized();

  const champions = await getChampionAssets();
  if (!champions) return appJson(503, { error: "unavailable" });
  return appJson(200, {
    version: champions.version,
    champions: champions.list().flatMap((champion) => {
      const key = champions.keyOf(champion.id);
      return key === null ? [] : [{ key, ...champion }];
    }),
  });
}
