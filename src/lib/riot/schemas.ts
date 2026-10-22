import { z } from "zod";

/**
 * Forme des réponses de l'API Riot, réduite à ce que l'application utilise.
 * Les champs non listés sont conservés tels quels (`looseObject`) : la partie
 * brute est stockée entière pour les étapes suivantes.
 */

export const riotAccountSchema = z.object({
  puuid: z.string().min(1),
  gameName: z.string(),
  tagLine: z.string(),
});

export const summonerSchema = z.looseObject({
  puuid: z.string(),
  profileIconId: z.number().int(),
  summonerLevel: z.number().int(),
});

export const leagueEntrySchema = z.looseObject({
  queueType: z.string(),
  tier: z.string(),
  rank: z.string(),
  leaguePoints: z.number().int(),
  wins: z.number().int(),
  losses: z.number().int(),
});
export const leagueEntriesSchema = z.array(leagueEntrySchema);

export const matchIdsSchema = z.array(z.string().min(1));

/** Joueurs d'un palier (League-V4) : seul le PUUID sert, pour trouver leurs parties. */
export const ladderEntriesSchema = z.array(z.looseObject({ puuid: z.string().min(1) }));
/** Ligue Maître, Grand Maître ou Challenger (League-V4). */
export const apexLeagueSchema = z.looseObject({ entries: ladderEntriesSchema });

export const matchParticipantSchema = z.looseObject({
  puuid: z.string(),
  teamId: z.number().int(),
  championId: z.number().int(),
  championName: z.string(),
  teamPosition: z.string().optional().default(""),
  win: z.boolean(),
  kills: z.number().int(),
  deaths: z.number().int(),
  assists: z.number().int(),
  champLevel: z.number().int().optional().default(0),
  totalMinionsKilled: z.number().int().optional().default(0),
  neutralMinionsKilled: z.number().int().optional().default(0),
  goldEarned: z.number().int().optional().default(0),
  totalDamageDealtToChampions: z.number().int().optional().default(0),
  visionScore: z.number().int().optional().default(0),
});

export const matchSchema = z.looseObject({
  metadata: z.looseObject({ matchId: z.string().min(1) }),
  info: z.looseObject({
    gameCreation: z.number(),
    gameStartTimestamp: z.number().optional(),
    gameDuration: z.number(),
    gameVersion: z.string(),
    queueId: z.number().int(),
    participants: z.array(matchParticipantSchema).min(1),
  }),
});

/** Spectator-V5 : la partie en cours d'un joueur. */
export const activeGameSchema = z.looseObject({
  gameId: z.number(),
  gameQueueConfigId: z.number().int().optional().default(0),
  gameMode: z.string().optional().default(""),
  /** Début de la partie (millisecondes) ; 0 tant que le chargement n'est pas fini. */
  gameStartTime: z.number().optional().default(0),
  gameLength: z.number().optional().default(0),
  participants: z.array(
    z.looseObject({
      puuid: z.string().nullable().optional().default(null),
      teamId: z.number().int(),
      championId: z.number().int(),
      spell1Id: z.number().int().optional().default(0),
      spell2Id: z.number().int().optional().default(0),
      riotId: z.string().optional(),
      bot: z.boolean().optional().default(false),
      perks: z
        .looseObject({
          perkIds: z.array(z.number().int()).optional().default([]),
          perkStyle: z.number().int().optional(),
          perkSubStyle: z.number().int().optional(),
        })
        .optional(),
    }),
  ),
  bannedChampions: z
    .array(z.looseObject({ championId: z.number().int(), teamId: z.number().int() }))
    .optional()
    .default([]),
});

export type ActiveGameDto = z.infer<typeof activeGameSchema>;

/**
 * Match-V5, chronologie d'une partie : une image par minute (or de chaque
 * joueur) et les événements (achats, compétences, objectifs…). Seuls les
 * champs utilisés sont décrits ; le reste est ignoré.
 */
const timelineEventSchema = z.looseObject({
  type: z.string(),
  timestamp: z.number(),
  participantId: z.number().int().optional(),
  itemId: z.number().int().optional(),
  beforeId: z.number().int().optional(),
  skillSlot: z.number().int().optional(),
  levelUpType: z.string().optional(),
  killerTeamId: z.number().int().optional(),
  teamId: z.number().int().optional(),
  monsterType: z.string().optional(),
  monsterSubType: z.string().optional(),
  buildingType: z.string().optional(),
  killerId: z.number().int().optional(),
  victimId: z.number().int().optional(),
  assistingParticipantIds: z.array(z.number().int()).optional(),
});

export const timelineSchema = z.looseObject({
  info: z.looseObject({
    frameInterval: z.number().optional().default(60_000),
    participants: z.array(z.looseObject({ participantId: z.number().int(), puuid: z.string() })),
    frames: z.array(
      z.looseObject({
        timestamp: z.number(),
        participantFrames: z.record(
          z.string(),
          z.looseObject({
            totalGold: z.number(),
            minionsKilled: z.number().optional().default(0),
            jungleMinionsKilled: z.number().optional().default(0),
            xp: z.number().optional().default(0),
          }),
        ),
        events: z.array(timelineEventSchema).optional().default([]),
      }),
    ),
  }),
});

export type TimelineDto = z.infer<typeof timelineSchema>;
export type RiotAccountDto = z.infer<typeof riotAccountSchema>;
export type SummonerDto = z.infer<typeof summonerSchema>;
export type LeagueEntryDto = z.infer<typeof leagueEntrySchema>;
export type MatchDto = z.infer<typeof matchSchema>;
export type MatchParticipantDto = z.infer<typeof matchParticipantSchema>;

/**
 * Lecture détaillée d'une partie stockée, pour la page de détail : les dix
 * joueurs avec leurs objets, sorts et runes, et les objectifs des équipes.
 * Les champs absents des anciennes parties prennent une valeur neutre.
 */
const int = z.number().int().optional().default(0);

const objectiveSchema = z.looseObject({ kills: int }).optional().default({ kills: 0 });

export const matchDetailParticipantSchema = z.looseObject({
  puuid: z.string(),
  teamId: z.number().int(),
  championName: z.string(),
  teamPosition: z.string().optional().default(""),
  riotIdGameName: z.string().optional(),
  riotIdTagline: z.string().optional(),
  win: z.boolean(),
  champLevel: int,
  kills: int,
  deaths: int,
  assists: int,
  totalMinionsKilled: int,
  neutralMinionsKilled: int,
  goldEarned: int,
  totalDamageDealtToChampions: int,
  totalDamageTaken: int,
  visionScore: int,
  wardsPlaced: int,
  /** Pinks posées (le champ « controlWardsPlaced » n'existe pas chez Riot). */
  detectorWardsPlaced: int,
  /** Pinks achetées. */
  visionWardsBoughtInGame: int,
  item0: int,
  item1: int,
  item2: int,
  item3: int,
  item4: int,
  item5: int,
  item6: int,
  summoner1Id: int,
  summoner2Id: int,
  perks: z
    .looseObject({
      styles: z.array(
        z.looseObject({
          description: z.string().optional(),
          style: z.number().int(),
          selections: z.array(z.looseObject({ perk: z.number().int() })),
        }),
      ),
    })
    .optional(),
});

export const matchDetailTeamSchema = z.looseObject({
  teamId: z.number().int(),
  win: z.boolean(),
  objectives: z
    .looseObject({
      champion: objectiveSchema,
      tower: objectiveSchema,
      inhibitor: objectiveSchema,
      dragon: objectiveSchema,
      baron: objectiveSchema,
      riftHerald: objectiveSchema,
      horde: objectiveSchema,
      atakhan: objectiveSchema,
    })
    .optional(),
});

export const matchDetailSchema = z.looseObject({
  metadata: z.looseObject({ matchId: z.string().min(1) }),
  info: z.looseObject({
    gameCreation: z.number(),
    gameStartTimestamp: z.number().optional(),
    gameDuration: z.number(),
    gameVersion: z.string(),
    queueId: z.number().int(),
    participants: z.array(matchDetailParticipantSchema).min(1),
    teams: z.array(matchDetailTeamSchema).optional().default([]),
  }),
});

export type MatchDetailDto = z.infer<typeof matchDetailSchema>;
export type MatchDetailParticipantDto = z.infer<typeof matchDetailParticipantSchema>;
