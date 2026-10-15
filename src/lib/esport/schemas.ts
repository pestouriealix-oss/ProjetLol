import { z } from "zod";

/**
 * Forme des réponses de PandaScore, réduite à ce que l'onglet Esport utilise.
 * Les objets restent ouverts (`looseObject`) : PandaScore ajoute régulièrement
 * des champs, ils ne doivent rien casser.
 */

const id = z.number().int();
const date = z.string().nullable().optional().default(null);

export const teamSchema = z.looseObject({
  id,
  name: z.string(),
  acronym: z.string().nullable().optional().default(null),
  image_url: z.string().nullable().optional().default(null),
});

export const matchSchema = z.looseObject({
  id,
  name: z.string().optional().default(""),
  /** « not_started », « running », « finished », « canceled », « postponed »… */
  status: z.string(),
  scheduled_at: date,
  begin_at: date,
  number_of_games: z.number().int().optional().default(1),
  opponents: z
    .array(z.looseObject({ type: z.string().optional(), opponent: teamSchema }))
    .optional()
    .default([]),
  results: z
    .array(z.looseObject({ team_id: id, score: z.number().int() }))
    .optional()
    .default([]),
  winner_id: id.nullable().optional().default(null),
  streams_list: z
    .array(
      z.looseObject({
        language: z.string().optional(),
        raw_url: z.string().nullable().optional(),
        official: z.boolean().optional(),
        main: z.boolean().optional(),
      }),
    )
    .optional()
    .default([]),
});
export const matchesSchema = z.array(matchSchema);

export const bracketMatchSchema = matchSchema.extend({
  previous_matches: z
    .array(z.looseObject({ match_id: id, type: z.enum(["winner", "loser"]).catch("winner") }))
    .optional()
    .default([]),
});
export const bracketSchema = z.array(bracketMatchSchema);

export const standingSchema = z.looseObject({
  rank: z.number().int(),
  team: teamSchema,
  wins: z.number().int().optional(),
  losses: z.number().int().optional(),
});
export const standingsSchema = z.array(standingSchema);

export const tournamentSchema = z.looseObject({
  id,
  name: z.string(),
  begin_at: date,
  end_at: date,
  tier: z.string().nullable().optional().default(null),
  has_bracket: z.boolean().optional().default(false),
  serie_id: id,
  serie: z.looseObject({
    id,
    name: z.string().nullable().optional().default(null),
    full_name: z.string().nullable().optional().default(null),
    year: z.number().int().nullable().optional().default(null),
  }),
  league: z.looseObject({
    id,
    name: z.string(),
    image_url: z.string().nullable().optional().default(null),
  }),
});
export const tournamentsSchema = z.array(tournamentSchema);

export type EsportTeam = z.infer<typeof teamSchema>;
export type EsportMatch = z.infer<typeof matchSchema>;
export type BracketMatch = z.infer<typeof bracketMatchSchema>;
export type Standing = z.infer<typeof standingSchema>;
export type Tournament = z.infer<typeof tournamentSchema>;
