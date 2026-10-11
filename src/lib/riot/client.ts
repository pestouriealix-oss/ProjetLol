import type { z } from "zod";

import { PLATFORMS, type Platform } from "@/lib/config";

import { RiotApiError } from "./errors";

/**
 * Client HTTP de l'API Riot. Il ne connaît que le transport : clé, serveurs,
 * délais, limites d'appels et validation de la réponse. Les appels eux-mêmes
 * sont dans `api.ts`.
 *
 * La clé ne quitte jamais le serveur : ce module n'est importé que par du code
 * serveur (voir `index.ts`).
 */

export type RiotClientOptions = {
  apiKey: string | undefined;
  /** Remplace tous les serveurs de Riot par une seule adresse (tests). */
  baseUrl?: string;
  fetch?: typeof fetch;
  /** Attente, injectable pour que les tests ne dorment pas vraiment. */
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
};

/** Attente maximale acceptée quand Riot demande de patienter, en secondes. */
const MAX_RETRY_AFTER_SECONDS = 10;

/** Account-V1 n'existe pas sur la route « sea » : Riot la sert depuis « asia ». */
const accountRouting = (platform: Platform) => {
  const routing = PLATFORMS[platform].routing;
  return routing === "sea" ? "asia" : routing;
};

export type RiotHost =
  /** Serveur de la plateforme (euw1, kr…) : classement. */
  | { kind: "platform"; platform: Platform }
  /** Serveur régional (europe, asia…) : parties. */
  | { kind: "regional"; platform: Platform }
  /** Serveur régional des comptes Riot. */
  | { kind: "account"; platform: Platform };

function hostName(host: RiotHost): string {
  switch (host.kind) {
    case "platform":
      return host.platform.toLowerCase();
    case "regional":
      return PLATFORMS[host.platform].routing;
    case "account":
      return accountRouting(host.platform);
  }
}

export type RiotClient = {
  get<Schema extends z.ZodType>(
    host: RiotHost,
    path: string,
    schema: Schema,
    query?: Record<string, string | number>,
  ): Promise<z.infer<Schema>>;
};

export function createRiotClient({
  apiKey,
  baseUrl,
  fetch: fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  timeoutMs = 8000,
}: RiotClientOptions): RiotClient {
  const request = async (url: string, attempt: number): Promise<unknown> => {
    if (!apiKey) throw new RiotApiError("missing_key", "RIOT_API_KEY n'est pas définie.");

    let response: Response;
    try {
      response = await fetchImpl(url, {
        headers: { "X-Riot-Token": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new RiotApiError("unavailable", `Riot ne répond pas : ${String(error)}`);
    }

    if (response.ok) {
      try {
        return await response.json();
      } catch {
        throw new RiotApiError("unavailable", "Réponse de Riot illisible.");
      }
    }

    switch (response.status) {
      case 401:
      case 403:
        throw new RiotApiError("invalid_key", "Clé de l'API Riot refusée ou expirée.");
      case 404:
        throw new RiotApiError("not_found", "Introuvable chez Riot.");
      case 429: {
        const retryAfter = Number(response.headers.get("retry-after") ?? "1");
        const seconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 1;
        // Une courte attente : on patiente une fois. Au-delà, on rend la main.
        if (attempt === 0 && seconds <= MAX_RETRY_AFTER_SECONDS) {
          await sleep(seconds * 1000);
          return request(url, attempt + 1);
        }
        throw new RiotApiError("rate_limited", "Limite d'appels de l'API Riot atteinte.", seconds);
      }
      default:
        throw new RiotApiError("unavailable", `Riot a répondu ${response.status}.`);
    }
  };

  return {
    async get(host, path, schema, query) {
      const origin = baseUrl ?? `https://${hostName(host)}.api.riotgames.com`;
      const url = new URL(origin.replace(/\/$/, "") + path);
      for (const [key, value] of Object.entries(query ?? {})) {
        url.searchParams.set(key, String(value));
      }
      const parsed = schema.safeParse(await request(url.toString(), 0));
      if (!parsed.success) {
        throw new RiotApiError("unavailable", `Réponse inattendue de Riot pour ${path}.`);
      }
      return parsed.data;
    },
  };
}
