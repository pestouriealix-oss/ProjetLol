/**
 * Collecte des parties classées (Émeraude et plus) pour les statistiques de
 * matchups de la fiche de draft.
 *
 *   npm run matchups:collect                 # 30 minutes sur EUW
 *   npm run matchups:collect -- --minutes 120 --platform EUW1
 *   npm run matchups:collect -- --interval 100   # clé de production, plus rapide
 *
 * Utilise RIOT_API_KEY et DATABASE_URL du fichier .env. Les appels sont espacés
 * pour rester sous la limite d'une clé de développement (100 par 2 minutes) :
 * environ 2 000 parties par heure. On peut l'arrêter à tout moment (Ctrl + C),
 * ce qui est compté reste compté.
 */
import { parseArgs } from "node:util";

import { PLATFORM_IDS, type Platform } from "@/lib/config";
import { knownStatMatches, listStatPatches, recordStatMatch } from "@/lib/db/matchup-stats";
import { collectMatchups } from "@/lib/matchups/collect";
import { riotApi } from "@/lib/riot";

const { values } = parseArgs({
  options: {
    minutes: { type: "string", default: "30" },
    platform: { type: "string", default: "EUW1" },
    /** Écart entre deux appels (ms). 1300 pour une clé de développement ; moins avec une clé de production. */
    interval: { type: "string", default: "1300" },
  },
});

const minutes = Number(values.minutes);
const platform = values.platform as Platform;
const interval = Number(values.interval);
if (!Number.isFinite(minutes) || minutes <= 0) {
  throw new Error("--minutes doit être un nombre positif.");
}
if (!Number.isFinite(interval) || interval < 0) {
  throw new Error("--interval doit être un nombre positif.");
}
if (!(PLATFORM_IDS as readonly string[]).includes(platform)) {
  throw new Error(`--platform doit être l'un de : ${PLATFORM_IDS.join(", ")}.`);
}

// Script en ligne de commande : sa progression s'affiche dans le terminal.
/* eslint-disable no-console */
async function main() {
  console.log(`Collecte sur ${platform} pendant ${minutes} min (Ctrl + C pour arrêter)…`);
  const report = await collectMatchups(
    {
      api: riotApi,
      store: { known: knownStatMatches, record: recordStatMatch },
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      now: Date.now,
      random: Math.random,
      log: (message) => console.log(message),
    },
    { platform, budgetMs: minutes * 60_000, minIntervalMs: interval },
  );
  console.log(
    `Terminé : ${report.counted} parties comptées, ${report.ignored} ignorées, ${report.errors} erreurs, ${report.calls} appels.`,
  );
  for (const { patch, matches } of (await listStatPatches()).slice(0, 3)) {
    console.log(`  patch ${patch} : ${matches} parties au total`);
  }
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
