import { Radio } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import type { Platform } from "@/lib/config";
import { isRiotApiConfigured, riotApi } from "@/lib/riot";

const copy = t.live;

/**
 * Bandeau du tableau de bord quand le joueur est en partie. Il pose une seule
 * question à Riot, et n'affiche rien si la réponse tarde ou échoue : le reste
 * du tableau de bord ne l'attend jamais (il est rendu dans un `Suspense`).
 */
export async function LiveBanner({
  accountId,
  platform,
  puuid,
}: {
  accountId: string;
  platform: Platform;
  puuid: string | null;
}) {
  if (!puuid || !isRiotApiConfigured) return null;
  const game = await riotApi.getActiveGame(platform, puuid).catch(() => null);
  if (!game) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-warn/40 bg-warn-soft px-4 py-3">
      <p className="flex items-center gap-2.5 font-semibold text-ink">
        <span
          aria-hidden
          className="size-2 animate-pulse rounded-full bg-warn motion-reduce:animate-none"
        />
        {copy.banner}
      </p>
      <Button asChild size="sm" variant="secondary">
        <Link href={`/live?compte=${accountId}`}>
          <Radio aria-hidden />
          {copy.bannerAction}
        </Link>
      </Button>
    </div>
  );
}
