import type { z } from "zod";

import { EsportApiError } from "./errors";

import {
  bracketSchema,
  matchesSchema,
  standingsSchema,
  tournamentsSchema,
  type BracketMatch,
  type EsportMatch,
  type Standing,
  type Tournament,
} from "./schemas";

/**
 * Client de l'API PandaScore (offre gratuite : calendrier, résultats,
 * tournois). La clé ne quitte jamais le serveur : ce module n'est importé que
 * par du code serveur (voir `index.ts`).
 */

export type EsportClientOptions = {
  token: string | undefined;
  /** Autre adresse que celle de PandaScore (tests). */
  baseUrl?: string;
  fetch?: typeof fetch;
  /** Durée pendant laquelle une réponse est réutilisée, en secondes. */
  revalidateSeconds?: number;
  timeoutMs?: number;
};

export type TournamentStatus = "running" | "upcoming" | "past";

export type EsportApi = ReturnType<typeof createEsportApi>;

export function createEsportApi({
  token,
  baseUrl = "https://api.pandascore.co",
  fetch: fetchImpl = fetch,
  revalidateSeconds = 60,
  timeoutMs = 8000,
}: EsportClientOptions) {
  const get = async <Schema extends z.ZodType>(
    path: string,
    schema: Schema,
    query: Record<string, string | number> = {},
  ): Promise<z.infer<Schema>> => {
    if (!token) throw new EsportApiError("missing_key", "PANDASCORE_TOKEN n'est pas définie.");

    const url = new URL(baseUrl.replace(/\/$/, "") + path);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));

    let response: Response;
    try {
      response = await fetchImpl(url.toString(), {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        // Les résultats changent au fil des matchs : une minute de cache suffit
        // à rester sous la limite de l'offre gratuite.
        next: { revalidate: revalidateSeconds },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new EsportApiError("unavailable", `PandaScore ne répond pas : ${String(error)}`);
    }

    if (response.status === 401 || response.status === 403) {
      throw new EsportApiError("invalid_key", `PandaScore a refusé la clé (${response.status}).`);
    }
    if (response.status === 429) {
      throw new EsportApiError("rate_limited", "Limite d'appels de PandaScore atteinte.");
    }
    if (!response.ok) {
      throw new EsportApiError("unavailable", `PandaScore a répondu ${response.status}.`);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new EsportApiError("unavailable", "Réponse de PandaScore illisible.");
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new EsportApiError("unavailable", `Réponse inattendue de PandaScore pour ${path}.`);
    }
    return parsed.data;
  };

  return {
    /** Tournois de League of Legends par statut, filtrés par niveau (« s », « a »…). */
    listTournaments(status: TournamentStatus, tiers: string[]): Promise<Tournament[]> {
      return get(`/lol/tournaments/${status}`, tournamentsSchema, {
        "filter[tier]": tiers.join(","),
        sort: status === "past" ? "-end_at" : "begin_at",
        per_page: 50,
      });
    },

    /** Les étapes d'une compétition (Play-In, phase suisse, phase finale…), dans l'ordre. */
    listSerieTournaments(serieId: number): Promise<Tournament[]> {
      return get("/lol/tournaments", tournamentsSchema, {
        "filter[serie_id]": serieId,
        sort: "begin_at",
        per_page: 20,
      });
    },

    tournamentMatches(tournamentId: number): Promise<EsportMatch[]> {
      return get(`/tournaments/${tournamentId}/matches`, matchesSchema, {
        sort: "scheduled_at",
        per_page: 100,
      });
    },

    tournamentStandings(tournamentId: number): Promise<Standing[]> {
      return get(`/tournaments/${tournamentId}/standings`, standingsSchema, { per_page: 50 });
    },

    tournamentBracket(tournamentId: number): Promise<BracketMatch[]> {
      return get(`/tournaments/${tournamentId}/brackets`, bracketSchema, { per_page: 100 });
    },
  };
}
