import "server-only";

import { env } from "@/lib/env";

import { createEsportApi } from "./client";

/** L'API PandaScore configurée avec la clé du serveur. */
export const esportApi = createEsportApi({
  token: env.PANDASCORE_TOKEN,
  baseUrl: env.PANDASCORE_BASE_URL,
});

export const isEsportConfigured = Boolean(env.PANDASCORE_TOKEN);

export { EsportApiError } from "./errors";
