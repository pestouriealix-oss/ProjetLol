import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";

import { PageShell } from "@/components/layout/page-shell";
import { PlayerSearchForm } from "@/components/player/player-search-form";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { DEFAULT_PLATFORM, PLATFORMS } from "@/lib/config";
import { listRiotAccounts } from "@/lib/db/riot-accounts";
import { platformFromServer, playerPath } from "@/lib/players/slug";
import { formatRiotId, parseRiotId } from "@/lib/validation/riot";

export const metadata: Metadata = { title: t.player.searchTitle };

const copy = t.player;

/** `?q=Pseudo%23TAG&serveur=euw` ; toute valeur inattendue est ignorée. */
const searchSchema = z.object({
  q: z.string().max(64).optional().catch(undefined),
  serveur: z.string().max(8).optional().catch(undefined),
});

export default async function PlayerSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; serveur?: string | string[] }>;
}) {
  const user = await requireUser();
  const [params, accounts] = await Promise.all([searchParams, listRiotAccounts(user.id)]);
  const { q, serveur } = searchSchema.parse(params);
  // Par défaut, le serveur de son compte principal : on cherche surtout ceux qu'on croise.
  const platform = platformFromServer(serveur) ?? accounts[0]?.platform ?? DEFAULT_PLATFORM;

  let error: string | undefined;
  if (q?.trim()) {
    const parsed = parseRiotId(q);
    if (parsed.ok) redirect(playerPath(platform, parsed.value));
    error = parsed.error;
  }

  return (
    <PageShell route="player-search" title={copy.searchTitle}>
      <p className="-mt-4 max-w-2xl text-lg text-ink-muted">{copy.searchIntro}</p>
      <Panel className="max-w-3xl p-5 sm:p-6">
        <PlayerSearchForm defaultQuery={q} defaultPlatform={platform} error={error} />
      </Panel>
      {accounts.length > 0 ? (
        <section aria-labelledby="own-accounts" className="flex flex-col gap-3">
          <h2 id="own-accounts" className="display text-xl text-ink">
            {copy.yourAccounts}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {accounts.map((account) => (
              <li key={account.id}>
                <Link
                  href={playerPath(account.platform, account)}
                  className="flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-2 transition-colors duration-(--duration-fast) ease-(--ease-out) hover:border-line-strong hover:bg-raised"
                >
                  <span className="font-semibold text-ink">{formatRiotId(account)}</span>
                  <Badge>{PLATFORMS[account.platform].short}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PageShell>
  );
}
