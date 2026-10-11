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

export type RiotAccountDto = z.infer<typeof riotAccountSchema>;
export type LeagueEntryDto = z.infer<typeof leagueEntrySchema>;
export type MatchDto = z.infer<typeof matchSchema>;
export type MatchParticipantDto = z.infer<typeof matchParticipantSchema>;
