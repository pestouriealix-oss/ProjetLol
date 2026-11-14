/**
 * Régularité : quand le joueur joue. Une grille de jours façon calendrier, ses
 * séries de jours joués, et le bilan des parties selon leur rang dans la journée
 * (les premières contre les suivantes), ce que le coach voit le plus souvent
 * dans un tilt.
 *
 * Les jours sont comptés à l'heure de Paris : une partie lancée à 1 h du matin
 * appartient au jour qui commence, comme sur le reste du site.
 */

/** Ce qu'il faut d'une partie : quand elle a commencé et si elle est gagnée. */
export type DatedGame = { startedAt: Date; win: boolean };

export type CalendarDay = {
  /** « 2026-11-14 », à l'heure de Paris. */
  key: string;
  /** Midi de ce jour, en UTC : sans ambiguïté de fuseau pour l'afficher. */
  date: Date;
  games: number;
  wins: number;
  /** 0 (aucune partie) à 4 (journée chargée). */
  level: 0 | 1 | 2 | 3 | 4;
  /** Jour à venir dans la dernière semaine : la case reste vide. */
  future: boolean;
};

export type Calendar = {
  /** Semaines du lundi au dimanche, de la plus ancienne à la plus récente. */
  weeks: CalendarDay[][];
  activeDays: number;
  games: number;
  /** Plus longue suite de jours joués d'affilée. */
  longestStreak: number;
  /** Suite en cours : jusqu'à aujourd'hui, ou hier si rien n'est encore joué aujourd'hui. */
  currentStreak: number;
};

/** Rang d'une partie dans sa journée à partir duquel on compte « la suite ». */
export const LATE_GAME_FROM = 4;
/** Parties qu'il faut de chaque côté pour comparer : en dessous, le hasard parle plus fort. */
export const MIN_COMPARED_GAMES = 10;

export type SessionSplit = {
  early: { games: number; wins: number };
  late: { games: number; wins: number };
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** « 2026-11-14 » : le jour d'une date dans ce fuseau. */
export function dayKey(date: Date, timeZone: string): string {
  // en-CA écrit les dates en AAAA-MM-JJ.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Midi UTC du jour `key` : une date qui tombe ce jour-là dans tous les fuseaux d'Europe. */
function noon(key: string): Date {
  return new Date(`${key}T12:00:00Z`);
}

function level(games: number): CalendarDay["level"] {
  if (games === 0) return 0;
  if (games <= 2) return 1;
  if (games <= 4) return 2;
  if (games <= 7) return 3;
  return 4;
}

/**
 * La grille des `weekCount` dernières semaines, la dernière étant celle
 * d'aujourd'hui, et les séries de jours joués.
 */
export function buildCalendar(
  games: readonly DatedGame[],
  today: Date,
  timeZone: string,
  weekCount = 53,
): Calendar {
  const byDay = new Map<string, { games: number; wins: number }>();
  for (const game of games) {
    const key = dayKey(game.startedAt, timeZone);
    const day = byDay.get(key) ?? { games: 0, wins: 0 };
    day.games += 1;
    if (game.win) day.wins += 1;
    byDay.set(key, day);
  }

  const todayKey = dayKey(today, timeZone);
  const todayNoon = noon(todayKey);
  // Lundi = 0 … dimanche = 6.
  const weekday = (todayNoon.getUTCDay() + 6) % 7;
  const firstMonday = new Date(todayNoon.getTime() - (weekday + (weekCount - 1) * 7) * DAY_MS);

  const weeks: CalendarDay[][] = [];
  let activeDays = 0;
  let total = 0;
  let longestStreak = 0;
  let run = 0;
  let currentStreak = 0;

  for (let week = 0; week < weekCount; week += 1) {
    const days: CalendarDay[] = [];
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(firstMonday.getTime() + (week * 7 + index) * DAY_MS);
      const key = date.toISOString().slice(0, 10);
      const future = key > todayKey;
      const played = future ? undefined : byDay.get(key);
      const count = played?.games ?? 0;
      days.push({
        key,
        date,
        games: count,
        wins: played?.wins ?? 0,
        level: level(count),
        future,
      });
      if (future) continue;
      if (count > 0) {
        activeDays += 1;
        total += count;
        run += 1;
        longestStreak = Math.max(longestStreak, run);
      } else if (key !== todayKey) {
        // Aujourd'hui sans partie ne casse pas la série : la journée n'est pas finie.
        run = 0;
      }
      if (key === todayKey) currentStreak = run;
    }
    weeks.push(days);
  }

  return { weeks, activeDays, games: total, longestStreak, currentStreak };
}

/**
 * Bilan des premières parties de chaque journée contre les suivantes (à partir
 * de la `LATE_GAME_FROM`-ième). Rend `null` tant qu'un des deux côtés a moins de
 * `MIN_COMPARED_GAMES` parties.
 */
export function splitBySession(games: readonly DatedGame[], timeZone: string): SessionSplit | null {
  const sorted = [...games].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  const split: SessionSplit = { early: { games: 0, wins: 0 }, late: { games: 0, wins: 0 } };
  let currentDay = "";
  let rank = 0;
  for (const game of sorted) {
    const key = dayKey(game.startedAt, timeZone);
    rank = key === currentDay ? rank + 1 : 1;
    currentDay = key;
    const side = rank >= LATE_GAME_FROM ? split.late : split.early;
    side.games += 1;
    if (game.win) side.wins += 1;
  }
  return split.early.games >= MIN_COMPARED_GAMES && split.late.games >= MIN_COMPARED_GAMES
    ? split
    : null;
}
