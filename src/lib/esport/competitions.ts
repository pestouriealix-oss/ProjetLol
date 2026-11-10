import type { EsportMatch, EsportTeam, Serie, Tournament } from "./schemas";

/**
 * Mise en forme des données de PandaScore pour l'onglet Esport. Fonctions
 * pures : aucune requête, testées sur des données fabriquées.
 */

/** Une compétition (« Worlds 2026 ») et ses étapes (« Play-In », « Swiss Stage »…). */
export type Competition = {
  serieId: number;
  title: string;
  leagueName: string;
  leagueImage: string | null;
  /** Niveau le plus haut parmi ses étapes : « s » pour les Worlds, le MSI… */
  tier: string | null;
  beginAt: Date | null;
  endAt: Date | null;
  stages: Tournament[];
};

const time = (value: string | null) => (value ? new Date(value).getTime() : Number.NaN);
const TIER_ORDER = ["s", "a", "b", "c", "d"];
const tierRank = (tier: string | null) => {
  const index = TIER_ORDER.indexOf((tier ?? "").toLowerCase());
  return index === -1 ? TIER_ORDER.length : index;
};

export function competitionTitle(tournament: Tournament): string {
  const edition =
    tournament.serie.full_name ?? (tournament.serie.year ? String(tournament.serie.year) : "");
  return [tournament.league.name, edition].filter(Boolean).join(" ");
}

/** Regroupe des tournois par compétition, étapes dans l'ordre chronologique. */
export function groupBySerie(tournaments: Tournament[]): Competition[] {
  const bySerie = new Map<number, Tournament[]>();
  for (const tournament of tournaments) {
    const list = bySerie.get(tournament.serie_id) ?? [];
    if (!list.some((known) => known.id === tournament.id)) list.push(tournament);
    bySerie.set(tournament.serie_id, list);
  }
  return [...bySerie.entries()].map(([serieId, stages]) => {
    const sorted = [...stages].sort((a, b) => (time(a.begin_at) || 0) - (time(b.begin_at) || 0));
    const first = sorted[0]!;
    const begins = sorted.map((stage) => time(stage.begin_at)).filter(Number.isFinite);
    const ends = sorted.map((stage) => time(stage.end_at)).filter(Number.isFinite);
    return {
      serieId,
      title: competitionTitle(first),
      leagueName: first.league.name,
      leagueImage: first.league.image_url,
      tier: [...sorted].sort((a, b) => tierRank(a.tier) - tierRank(b.tier))[0]?.tier ?? null,
      beginAt: begins.length > 0 ? new Date(Math.min(...begins)) : null,
      endAt: ends.length > 0 ? new Date(Math.max(...ends)) : null,
      stages: sorted,
    };
  });
}

/**
 * La compétition à mettre en avant : la plus prestigieuse de celles en cours
 * (les Worlds avant une ligue régionale), sinon la prochaine à commencer.
 */
export function pickFeatured(running: Competition[], upcoming: Competition[]): Competition | null {
  const byPrestige = (a: Competition, b: Competition) =>
    tierRank(a.tier) - tierRank(b.tier) ||
    (a.beginAt?.getTime() ?? Infinity) - (b.beginAt?.getTime() ?? Infinity);
  const bestRunning = [...running].sort(byPrestige)[0];
  const bestUpcoming = [...upcoming].sort(byPrestige)[0];
  if (bestRunning && (!bestUpcoming || tierRank(bestRunning.tier) <= tierRank(bestUpcoming.tier))) {
    return bestRunning;
  }
  return bestUpcoming ?? bestRunning ?? null;
}

/**
 * L'étape à afficher : celle demandée si elle existe, sinon celle en cours,
 * sinon la prochaine, sinon la dernière jouée.
 */
export function pickStage(
  stages: Tournament[],
  now: Date,
  requestedId?: number,
): Tournament | null {
  const requested = stages.find((stage) => stage.id === requestedId);
  if (requested) return requested;
  const at = now.getTime();
  const running = stages.find((stage) => time(stage.begin_at) <= at && !(time(stage.end_at) < at));
  if (running) return running;
  const next = stages.find((stage) => time(stage.begin_at) > at);
  return next ?? stages.at(-1) ?? null;
}

export type MatchSide = {
  team: EsportTeam | null;
  score: number | null;
  isWinner: boolean;
};

/** Les deux équipes d'un match, avec leur score ; `team` est `null` tant qu'elle n'est pas connue. */
export function matchSides(match: EsportMatch): [MatchSide, MatchSide] {
  const side = (index: number): MatchSide => {
    const team = match.opponents[index]?.opponent ?? null;
    const score = team
      ? (match.results.find((result) => result.team_id === team.id)?.score ?? null)
      : null;
    return { team, score, isWinner: team !== null && match.winner_id === team.id };
  };
  return [side(0), side(1)];
}

/** Statut d'un match, ramené à ce que l'interface distingue. */
export function matchState(match: EsportMatch): "live" | "finished" | "upcoming" | "canceled" {
  if (match.status === "running") return "live";
  if (match.status === "finished") return "finished";
  if (match.status === "canceled" || match.status === "postponed") return "canceled";
  return "upcoming";
}

/** Jour d'un match (« 2026-10-15 ») dans le fuseau donné. */
export function matchDay(match: EsportMatch, timeZone: string): string | null {
  const when = match.begin_at ?? match.scheduled_at;
  if (!when) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(when));
}

/** Matchs regroupés par jour, dans l'ordre ; les matchs sans date à la fin. */
export function groupByDay(
  matches: EsportMatch[],
  timeZone: string,
): { day: string | null; matches: EsportMatch[] }[] {
  const days = new Map<string | null, EsportMatch[]>();
  const sorted = [...matches].sort(
    (a, b) =>
      (time(a.begin_at ?? a.scheduled_at) || Infinity) -
      (time(b.begin_at ?? b.scheduled_at) || Infinity),
  );
  for (const match of sorted) {
    const day = matchDay(match, timeZone);
    days.set(day, [...(days.get(day) ?? []), match]);
  }
  return [...days.entries()].map(([day, list]) => ({ day, matches: list }));
}

/**
 * Les rendez-vous de la saison suivis par l'onglet : les trois grandes ligues
 * (Europe, Corée, Chine) et les compétitions internationales, dans l'ordre de
 * l'année. Reconnus au nom de leur ligue chez PandaScore.
 */
export const SEASON_CIRCUITS = [
  { key: "LEC", match: (league: string) => /^lec$/i.test(league) },
  { key: "LCK", match: (league: string) => /^lck$/i.test(league) },
  { key: "LPL", match: (league: string) => /^lpl$/i.test(league) },
  { key: "FIRST_STAND", match: (league: string) => /first stand/i.test(league) },
  { key: "MSI", match: (league: string) => /^msi$|mid-season/i.test(league) },
  { key: "EWC", match: (league: string) => /esports world cup/i.test(league) },
  { key: "WORLDS", match: (league: string) => /^worlds$|world championship/i.test(league) },
] as const;
export type SeasonCircuit = (typeof SEASON_CIRCUITS)[number]["key"];

export type SeasonEntry = {
  circuit: SeasonCircuit;
  /** Le prochain rendez-vous (ou celui en cours), `null` tant que rien n'est annoncé. */
  next: {
    serieId: number;
    title: string;
    leagueImage: string | null;
    beginAt: Date | null;
    endAt: Date | null;
    live: boolean;
  } | null;
};

/**
 * Pour chaque rendez-vous suivi, la saison en cours ou la prochaine annoncée,
 * d'après les saisons de PandaScore (`/lol/series/running` et `upcoming`).
 */
export function seasonCalendar(series: Serie[], now: Date): SeasonEntry[] {
  const at = now.getTime();
  return SEASON_CIRCUITS.map(({ key, match }) => {
    const candidates = series
      .filter((serie) => match(serie.league.name) || match(serie.league.slug))
      // Une saison déjà terminée ne compte plus.
      .filter((serie) => !(time(serie.end_at) < at))
      .sort((a, b) => (time(a.begin_at) || Infinity) - (time(b.begin_at) || Infinity));
    const serie = candidates[0];
    if (!serie) return { circuit: key, next: null };
    const edition = serie.full_name ?? serie.name ?? (serie.year ? String(serie.year) : "");
    return {
      circuit: key,
      next: {
        serieId: serie.id,
        title: [serie.league.name, edition].filter(Boolean).join(" "),
        leagueImage: serie.league.image_url,
        beginAt: serie.begin_at ? new Date(serie.begin_at) : null,
        endAt: serie.end_at ? new Date(serie.end_at) : null,
        live: time(serie.begin_at) <= at,
      },
    };
  });
}
