import { z } from "zod";

import { ROLES } from "@/lib/config";

import type { DetailPlayer, MatchDetail } from "./match-detail";
import type { ObjectiveType, ReducedTimeline } from "./timeline";

/**
 * Les faits d'une partie sur lesquels le bilan s'appuie : chiffres tirés de
 * Match-V5 et de sa chronologie, comparés au vis-à-vis et aux habitudes du
 * joueur à ce poste. Le modèle ne reçoit que ces faits ; la page les affiche à
 * côté du bilan. Fonctions pures, testées sans base ni réseau.
 */

/** Moments de la phase de voie où l'on compare le joueur à son vis-à-vis. */
export const LANE_MINUTES = [10, 15] as const;
/** Une mort dans ce délai avant un objectif pris par l'adversaire lui a coûté l'objectif. */
export const DEATH_BEFORE_OBJECTIVE_SECONDS = 60;
/** En dessous de ce nombre d'autres parties, les « habitudes » ne veulent rien dire. */
export const MIN_HABIT_GAMES = 5;
/** Fin de la phase de voie, pour compter les morts précoces. */
export const EARLY_GAME_SECONDS = 15 * 60;

const NEUTRAL_OBJECTIVES: ReadonlySet<ObjectiveType> = new Set([
  "dragon",
  "elder",
  "baron",
  "herald",
  "grubs",
  "atakhan",
]);

/** Totaux du joueur à un poste (mêmes champs que ceux de la base). */
export type RoleTotals = {
  games: number;
  wins: number;
  deaths: number;
  cs: number;
  damage: number;
  vision: number;
  /** Moyenne, de 0 à 1. */
  killParticipation: number;
  seconds: number;
};

const objectiveCounts = z.object({
  dragons: z.number(),
  grubs: z.number(),
  heralds: z.number(),
  barons: z.number(),
  towers: z.number(),
});

const reviewLineSchema = z.object({
  championName: z.string(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  csPerMinute: z.number(),
  goldPerMinute: z.number(),
  damagePerMinute: z.number(),
  /** De 0 à 1. */
  damageShare: z.number(),
  /** De 0 à 1. */
  killParticipation: z.number(),
  visionPerMinute: z.number(),
  controlWards: z.number(),
  /** Objectifs auxquels il a participé (défis Riot) ; `null` s'ils manquent. */
  objectiveTakedowns: z
    .object({
      dragons: z.number(),
      barons: z.number(),
      heralds: z.number(),
      grubs: z.number(),
      towers: z.number(),
    })
    .nullable()
    .default(null),
  soloKills: z.number().nullable().default(null),
});

const laneCheckpointSchema = z.object({
  minute: z.number(),
  /** Écarts du joueur sur son vis-à-vis (positif : en avance). */
  goldDiff: z.number(),
  csDiff: z.number(),
  xpDiff: z.number(),
});

const reviewHabitsSchema = z.object({
  /** Parties prises en compte (classées, même poste, hors celle-ci). */
  games: z.number(),
  winRate: z.number(),
  csPerMinute: z.number(),
  deathsPerGame: z.number(),
  killParticipation: z.number(),
  visionPerMinute: z.number(),
  damagePerMinute: z.number(),
});

const goldMoment = z.object({ minute: z.number(), gold: z.number() });

/** Schéma des faits : ils sont enregistrés avec le bilan et relus pour l'affichage. */
export const reviewFactsSchema = z.object({
  patch: z.string(),
  queueId: z.number(),
  win: z.boolean(),
  durationMinutes: z.number(),
  role: z.enum(ROLES),
  me: reviewLineSchema,
  opponent: reviewLineSchema.nullable(),
  /** Vide sans chronologie, sans vis-à-vis, ou si la partie s'est finie avant. */
  lane: z.array(laneCheckpointSchema),
  deaths: z.object({
    /** Moments des morts, en secondes ; vide sans chronologie. */
    times: z.array(z.number()),
    beforeMinute15: z.number(),
    /** Morts juste avant un objectif neutre pris par l'adversaire. */
    beforeEnemyObjective: z.number(),
  }),
  /** Écart d'or de l'équipe du joueur (positif : en avance) ; `null` sans chronologie. */
  teamGold: z
    .object({
      at10: z.number().nullable(),
      at20: z.number().nullable(),
      final: z.number(),
      biggestLead: goldMoment,
      biggestDeficit: goldMoment,
    })
    .nullable(),
  objectives: z.object({ ours: objectiveCounts, theirs: objectiveCounts }),
  habits: reviewHabitsSchema.nullable(),
  /**
   * Ce que le joueur a apporté à la partie au-delà de son farm, face à son
   * vis-à-vis : kills et assists avant 15 minutes, écart d'or en fin de partie.
   */
  impact: z
    .object({
      /** Kills et assists avant 15 minutes ; `null` sans chronologie. */
      takedownsBefore15: z.object({ me: z.number(), opponent: z.number().nullable() }).nullable(),
      /** Or du joueur moins celui de son vis-à-vis, en fin de partie. */
      goldDiffEnd: z.number().nullable(),
    })
    .nullable()
    .default(null),
});

export type ReviewFacts = z.infer<typeof reviewFactsSchema>;
export type ReviewLine = z.infer<typeof reviewLineSchema>;
export type LaneCheckpoint = z.infer<typeof laneCheckpointSchema>;
export type ReviewHabits = z.infer<typeof reviewHabitsSchema>;

function line(player: DetailPlayer, minutes: number): ReviewLine {
  const perMinute = (value: number) => (minutes > 0 ? value / minutes : 0);
  return {
    championName: player.championName,
    kills: player.kills,
    deaths: player.deaths,
    assists: player.assists,
    csPerMinute: player.csPerMinute,
    goldPerMinute: perMinute(player.gold),
    damagePerMinute: perMinute(player.damage),
    damageShare: player.damageShare,
    killParticipation: player.killParticipation,
    visionPerMinute: perMinute(player.vision),
    controlWards: player.controlWardsBought,
    objectiveTakedowns: player.objectiveTakedowns,
    soloKills: player.soloKills,
  };
}

/**
 * Habitudes à ce poste sans la partie elle-même : on retire ses chiffres des
 * totaux quand elle y est comptée (partie classée).
 */
export function habitsWithout(
  totals: RoleTotals | null,
  game: { counted: boolean; win: boolean; me: DetailPlayer; seconds: number },
): ReviewHabits | null {
  if (!totals) return null;
  const sub = game.counted ? 1 : 0;
  const games = totals.games - sub;
  if (games < MIN_HABIT_GAMES) return null;
  const seconds = totals.seconds - (game.counted ? game.seconds : 0);
  const minutes = seconds / 60;
  const without = (total: number, value: number) => total - (game.counted ? value : 0);
  return {
    games,
    winRate: without(totals.wins, game.win ? 1 : 0) / games,
    csPerMinute: minutes > 0 ? without(totals.cs, game.me.cs) / minutes : 0,
    deathsPerGame: without(totals.deaths, game.me.deaths) / games,
    killParticipation:
      (totals.killParticipation * totals.games - sub * game.me.killParticipation) / games,
    visionPerMinute: minutes > 0 ? without(totals.vision, game.me.vision) / minutes : 0,
    damagePerMinute: minutes > 0 ? without(totals.damage, game.me.damage) / minutes : 0,
  };
}

function laneCheckpoints(
  timeline: ReducedTimeline,
  me: DetailPlayer,
  opponent: DetailPlayer,
): LaneCheckpoint[] {
  const mine = timeline.players[me.puuid]?.frames;
  const theirs = timeline.players[opponent.puuid]?.frames;
  if (!mine || !theirs) return [];
  return LANE_MINUTES.flatMap((minute) => {
    const index = timeline.gold.findIndex((frame) => frame.minute === minute);
    if (index === -1 || index >= mine.gold.length || index >= theirs.gold.length) return [];
    return [
      {
        minute,
        goldDiff: mine.gold[index]! - theirs.gold[index]!,
        csDiff: mine.cs[index]! - theirs.cs[index]!,
        xpDiff: mine.xp[index]! - theirs.xp[index]!,
      },
    ];
  });
}

function teamGold(timeline: ReducedTimeline, ourTeamId: number): ReviewFacts["teamGold"] {
  if (timeline.gold.length === 0) return null;
  const diffs = timeline.gold.map((frame) => ({
    minute: frame.minute,
    gold: ourTeamId === 100 ? frame.blue - frame.red : frame.red - frame.blue,
  }));
  const at = (minute: number) => diffs.find((frame) => frame.minute === minute)?.gold ?? null;
  const lead = diffs.reduce((best, frame) => (frame.gold > best.gold ? frame : best));
  const deficit = diffs.reduce((worst, frame) => (frame.gold < worst.gold ? frame : worst));
  return {
    at10: at(10),
    at20: at(20),
    final: diffs.at(-1)!.gold,
    biggestLead: lead,
    biggestDeficit: deficit,
  };
}

/**
 * Les faits du bilan, ou `null` si la partie ne s'y prête pas (pas de poste
 * attribué par Riot : ARAM, modes spéciaux).
 */
export function buildReviewFacts(
  detail: MatchDetail,
  timeline: ReducedTimeline | null,
  roleTotals: RoleTotals | null,
  /** Vrai si cette partie est comptée dans `roleTotals` (partie classée). */
  countedInTotals: boolean,
): ReviewFacts | null {
  const { me } = detail;
  if (!me.role) return null;
  const [ours, theirs] = detail.teams;
  const minutes = detail.durationSeconds / 60;
  const opponent = theirs.players.find((player) => player.role === me.role) ?? null;

  const myTimeline = timeline?.players[me.puuid];
  const deathTimes = myTimeline?.deaths ?? [];
  const enemyObjectives = (timeline?.objectives ?? []).filter(
    (objective) => objective.teamId === theirs.teamId && NEUTRAL_OBJECTIVES.has(objective.type),
  );
  const beforeEnemyObjective = deathTimes.filter((death) =>
    enemyObjectives.some(
      (objective) =>
        objective.seconds >= death && objective.seconds - death <= DEATH_BEFORE_OBJECTIVE_SECONDS,
    ),
  ).length;

  const counts = (team: typeof ours) => ({
    dragons: team.objectives.dragons,
    grubs: team.objectives.grubs,
    heralds: team.objectives.heralds,
    barons: team.objectives.barons,
    towers: team.objectives.towers,
  });

  return {
    patch: detail.patch,
    queueId: detail.queueId,
    win: ours.win,
    durationMinutes: minutes,
    role: me.role,
    me: line(me, minutes),
    opponent: opponent ? line(opponent, minutes) : null,
    lane: timeline && opponent ? laneCheckpoints(timeline, me, opponent) : [],
    deaths: {
      times: deathTimes,
      beforeMinute15: deathTimes.filter((seconds) => seconds < EARLY_GAME_SECONDS).length,
      beforeEnemyObjective,
    },
    teamGold: timeline ? teamGold(timeline, ours.teamId) : null,
    objectives: { ours: counts(ours), theirs: counts(theirs) },
    impact: {
      takedownsBefore15: myTimeline
        ? {
            me: myTimeline.takedowns.filter((seconds) => seconds < EARLY_GAME_SECONDS).length,
            opponent: opponent
              ? (timeline?.players[opponent.puuid]?.takedowns ?? []).filter(
                  (seconds) => seconds < EARLY_GAME_SECONDS,
                ).length
              : null,
          }
        : null,
      goldDiffEnd: opponent ? me.gold - opponent.gold : null,
    },
    habits: habitsWithout(roleTotals, {
      counted: countedInTotals,
      win: ours.win,
      me,
      seconds: detail.durationSeconds,
    }),
  };
}
