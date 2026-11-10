import type { z } from "zod";

import { EsportApiError } from "./errors";

import {
  bracketSchema,
  matchesSchema,
  standingsSchema,
  seriesSchema,
  tournamentsSchema,
  type BracketMatch,
  type EsportMatch,
  type Serie,
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
  /** Horloge (tests). */
  now?: () => number;
};

export type TournamentStatus = "running" | "upcoming" | "past";
export type SerieStatus = "running" | "upcoming";

export type EsportApi = ReturnType<typeof createEsportApi>;

export function createEsportApi({
  token,
  baseUrl = "https://api.pandascore.co",
  fetch: fetchImpl = fetch,
  revalidateSeconds = 60,
  timeoutMs = 8000,
  now = () => Date.now(),
}: EsportClientOptions) {
  /**
   * Réponses gardées en mémoire, par adresse. Une réponse plus vieille que
   * `revalidateSeconds` est redemandée avant d'être montrée : jamais de
   * résultats d'hier au premier affichage. L'ancienne ne sert qu'en secours,
   * si PandaScore ne répond pas.
   */
  const memory = new Map<string, { at: number; value: unknown }>();

  const get = async <Schema extends z.ZodType>(
    path: string,
    schema: Schema,
    query: Record<string, string | number> = {},
    /** Valeur rendue quand PandaScore répond 404 (donnée pas encore publiée). */
    whenMissing?: z.infer<Schema>,
  ): Promise<z.infer<Schema>> => {
    if (!token) throw new EsportApiError("missing_key", "PANDASCORE_TOKEN n'est pas définie.");

    const url = new URL(baseUrl.replace(/\/$/, "") + path);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
    const key = url.toString();
    const kept = memory.get(key);
    if (kept && now() - kept.at < revalidateSeconds * 1000) return kept.value as z.infer<Schema>;

    try {
      const value = await request(key, path, schema, whenMissing);
      memory.set(key, { at: now(), value });
      return value;
    } catch (error) {
      const outage =
        error instanceof EsportApiError &&
        (error.kind === "unavailable" || error.kind === "rate_limited");
      if (outage && kept) return kept.value as z.infer<Schema>;
      throw error;
    }
  };

  const request = async <Schema extends z.ZodType>(
    url: string,
    path: string,
    schema: Schema,
    whenMissing?: z.infer<Schema>,
  ): Promise<z.infer<Schema>> => {
    let response: Response;
    try {
      response = await fetchImpl(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        // Pas de cache de Next.js : il rendait une réponse périmée au premier
        // affichage (même après un redémarrage). Le cache en mémoire ci-dessus
        // garde une minute, assez pour la limite de l'offre gratuite.
        cache: "no-store",
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
    if (response.status === 404 && whenMissing !== undefined) return whenMissing;
    if (!response.ok) {
      throw new EsportApiError(
        "unavailable",
        `PandaScore a répondu ${response.status} pour ${path}.`,
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new EsportApiError("unavailable", "Réponse de PandaScore illisible.");
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      // Les premiers écarts avec le schéma attendu, pour corriger vite d'après les journaux.
      const issues = parsed.error.issues
        .slice(0, 3)
        .map((issue) => `${issue.path.join(".") || "(racine)"} : ${issue.message}`)
        .join(" ; ");
      throw new EsportApiError(
        "unavailable",
        `Réponse inattendue de PandaScore pour ${path} (${issues}).`,
      );
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

    /** Saisons de LoL en cours ou à venir, annoncées parfois avant leurs tournois. */
    listSeries(status: SerieStatus): Promise<Serie[]> {
      return get(`/lol/series/${status}`, seriesSchema, { sort: "begin_at", per_page: 100 });
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
      return get(
        `/tournaments/${tournamentId}/matches`,
        matchesSchema,
        { sort: "scheduled_at", per_page: 100 },
        [],
      );
    },

    /**
     * Classement d'une étape. PandaScore répond 404 tant qu'il n'existe pas
     * (étape pas commencée, ou étape sans classement) : la liste est alors vide.
     */
    tournamentStandings(tournamentId: number): Promise<Standing[]> {
      return get(`/tournaments/${tournamentId}/standings`, standingsSchema, { per_page: 50 }, []);
    },

    tournamentBracket(tournamentId: number): Promise<BracketMatch[]> {
      return get(`/tournaments/${tournamentId}/brackets`, bracketSchema, { per_page: 100 }, []);
    },
  };
}
