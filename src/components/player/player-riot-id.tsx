import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import type { Platform } from "@/lib/config";
import { playerPath } from "@/lib/players/slug";
import { formatRiotId, parseRiotId, type RiotId } from "@/lib/validation/riot";

/**
 * Le Riot ID d'un joueur croisé dans une partie. Quand on connaît son serveur,
 * c'est un lien vers son profil, comme sur les sites de statistiques : un
 * clic sur un nom, et on voit à qui on a affaire.
 */
export function PlayerRiotId({
  riotId,
  platform,
  fallback,
}: {
  riotId: RiotId | null;
  /** Serveur de la partie ; sans lui, le nom reste un simple texte. */
  platform?: Platform;
  /** Texte quand Riot ne donne pas le nom (joueur masqué, robot). */
  fallback: string;
}) {
  if (!riotId?.gameName) {
    return <span className="min-w-0 truncate font-semibold text-ink">{fallback}</span>;
  }
  const name = (
    <>
      <span className="min-w-0 truncate font-semibold text-ink decoration-line-strong underline-offset-4 group-hover:underline">
        {riotId.gameName}
      </span>
      {riotId.tagLine ? (
        <span className="shrink-0 text-sm text-ink-faint max-sm:hidden">#{riotId.tagLine}</span>
      ) : null}
    </>
  );
  // Un Riot ID incomplet (tag manquant) ne mènerait à aucun profil.
  if (!platform || !parseRiotId(formatRiotId(riotId)).ok) return name;
  return (
    <Link
      href={playerPath(platform, riotId)}
      aria-label={t.player.openProfile(formatRiotId(riotId))}
      className="group flex min-w-0 items-baseline gap-1.5 rounded-control"
    >
      {name}
    </Link>
  );
}
