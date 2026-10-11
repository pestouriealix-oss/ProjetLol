import "server-only";

import { env } from "@/lib/env";

import { createRiotApi } from "./api";
import { createRiotClient } from "./client";

/** L'API Riot configurée avec la clé du serveur. */
export const riotApi = createRiotApi(
  createRiotClient({ apiKey: env.RIOT_API_KEY, baseUrl: env.RIOT_API_BASE_URL }),
);

export const isRiotApiConfigured = Boolean(env.RIOT_API_KEY);

export { RiotApiError } from "./errors";
