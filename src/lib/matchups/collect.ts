import type { Platform } from "@/lib/config";
import type { RiotApi } from "@/lib/riot/api";
import { RiotApiError } from "@/lib/riot/errors";
import type { MatchDto } from "@/lib/riot/schemas";
import { sampleMatch, type MatchSample } from "@/lib/stats/matchups";

/**
 * Collecte de parties classées pour les statistiques de matchups.
 *
 * On part des joueurs Émeraude et plus (League-V4), on prend leurs dernières
 * parties Solo/Duo (Match-V5), et chaque partie pas encore comptée alimente les
 * compteurs par patch, poste et duel. Les appels sont espacés pour rester sous
 * la limite de la clé Riot ; une limite atteinte fait patienter, pas échouer.
 * Aucun joueur n'est enregistré : seulement des compteurs et l'identifiant des
 * parties.
 */

export type CollectDeps = {
  api: Pick<RiotApi, "getLadderPage" | "getApexLadder" | "getSoloMatchIds" | "getMatch">;
  store: {
    known: (ids: readonly string[]) => Promise<Set<string>>;
    record: (matchId: string, platform: Platform, sample: MatchSample) => Promise<boolean>;
  };
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  random: () => number;
  log: (message: string) => void;
};

export type CollectOptions = {
  platform: Platform;
  /** Durée de la collecte, en millisecondes. */
  budgetMs: number;
  /**
   * Écart minimal entre deux appels à Riot. Clé de développement : 100 appels par
   * 2 minutes ; 1,5 s en laisse une vingtaine au site (partie en cours, synchro).
   */
  minIntervalMs?: number;
  /** Parties plus anciennes ignorées (en jours). */
  lookbackDays?: number;
  matchesPerPlayer?: number;
  playersPerLadder?: number;
  /** Arrêt après ce nombre de parties comptées (facultatif). */
  maxMatches?: number;
};

export type CollectReport = {
  /** Parties ajoutées aux statistiques. */
  counted: number;
  /** Parties lues mais qui ne comptent pas (autre file, partie écourtée…). */
  ignored: number;
  calls: number;
  errors: number;
};

type Ladder =
  | { kind: "apex"; tier: "challenger" | "grandmaster" | "master" }
  | {
      kind: "page";
      tier: "DIAMOND" | "EMERALD";
      division: "I" | "II" | "III" | "IV";
      page: number;
    };

const DIVISIONS = ["I", "II", "III", "IV"] as const;

/** Les classements d'où partir : Maître et plus, puis Diamant et Émeraude (trois pages par division). */
export function ladders(): Ladder[] {
  const apex: Ladder[] = (["challenger", "grandmaster", "master"] as const).map((tier) => ({
    kind: "apex",
    tier,
  }));
  const pages: Ladder[] = (["DIAMOND", "EMERALD"] as const).flatMap((tier) =>
    DIVISIONS.flatMap((division) =>
      [1, 2, 3].map((page) => ({ kind: "page" as const, tier, division, page })),
    ),
  );
  return [...apex, ...pages];
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other]!, copy[index]!];
  }
  return copy;
}

/** Plusieurs erreurs d'affilée : Riot ne répond plus, inutile d'insister. */
const MAX_CONSECUTIVE_ERRORS = 8;

export async function collectMatchups(
  deps: CollectDeps,
  {
    platform,
    budgetMs,
    minIntervalMs = 1500,
    lookbackDays = 14,
    matchesPerPlayer = 10,
    playersPerLadder = 25,
    maxMatches,
  }: CollectOptions,
): Promise<CollectReport> {
  const { api, store, sleep, now, random, log } = deps;
  const report: CollectReport = { counted: 0, ignored: 0, calls: 0, errors: 0 };
  const deadline = now() + budgetMs;
  const seen = new Set<string>();
  let lastCall = 0;
  let consecutiveErrors = 0;

  const done = () =>
    now() >= deadline ||
    (maxMatches !== undefined && report.counted >= maxMatches) ||
    consecutiveErrors >= MAX_CONSECUTIVE_ERRORS;

  /** Un appel à Riot, espacé des autres ; `null` si Riot n'a pas pu répondre. */
  const call = async <T>(run: () => Promise<T>): Promise<T | null> => {
    const wait = lastCall + minIntervalMs - now();
    if (wait > 0) await sleep(wait);
    lastCall = now();
    report.calls += 1;
    try {
      const result = await run();
      consecutiveErrors = 0;
      return result;
    } catch (error) {
      if (!(error instanceof RiotApiError)) throw error;
      if (error.kind === "invalid_key" || error.kind === "missing_key") throw error;
      report.errors += 1;
      if (error.kind === "rate_limited") {
        const seconds = error.retryAfterSeconds ?? 10;
        log(`Limite d'appels atteinte : pause de ${seconds} s.`);
        await sleep(seconds * 1000);
        lastCall = now();
        return null;
      }
      if (error.kind !== "not_found") consecutiveErrors += 1;
      return null;
    }
  };

  const startTime = Math.floor((now() - lookbackDays * 24 * 60 * 60 * 1000) / 1000);

  for (const ladder of shuffle(ladders(), random)) {
    if (done()) break;
    const players = await call(() =>
      ladder.kind === "apex"
        ? api.getApexLadder(platform, ladder.tier)
        : api.getLadderPage(platform, ladder.tier, ladder.division, ladder.page),
    );
    if (!players || players.length === 0) continue;

    for (const player of shuffle(players, random).slice(0, playersPerLadder)) {
      if (done()) break;
      const ids = await call(() =>
        api.getSoloMatchIds(platform, player.puuid, { count: matchesPerPlayer, startTime }),
      );
      if (!ids) continue;
      const fresh = ids.filter((id) => !seen.has(id));
      fresh.forEach((id) => seen.add(id));
      const known = await store.known(fresh);

      for (const id of fresh) {
        if (done()) break;
        if (known.has(id)) continue;
        const match: MatchDto | null = await call(() => api.getMatch(platform, id));
        if (!match) continue;
        const sample = sampleMatch(match);
        if (!sample) {
          report.ignored += 1;
          continue;
        }
        if (await store.record(id, platform, sample)) report.counted += 1;
      }
    }
    log(`${report.counted} parties comptées (${report.calls} appels à Riot).`);
  }

  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    log("Riot ne répond plus : collecte interrompue.");
  }
  return report;
}
