/**
 * Ce que le modèle a réellement coûté, pour régler les prix des offres :
 *
 *   npm run llm:costs              # les 30 derniers jours
 *   npm run llm:costs -- --days 7
 *
 * Coût moyen d'une fiche, part des duels resservis (déjà écrits, donc gratuits)
 * et détail par modèle. Lit DATABASE_URL du fichier .env.
 */
import { parseArgs } from "node:util";

import { siteLlmCostReport } from "@/lib/db/llm-usages";

const { values } = parseArgs({ options: { days: { type: "string", default: "30" } } });
const days = Number(values.days);
if (!Number.isFinite(days) || days <= 0) {
  console.error("--days doit être un nombre de jours positif.");
  process.exit(1);
}

const dollars = (micro: number, digits = 4) => `${(micro / 1_000_000).toFixed(digits)} $`;

/* eslint-disable no-console */
async function main() {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const { sheets, rows } = await siteLlmCostReport(since);

  console.log(`Sur les ${days} derniers jours :\n`);
  for (const row of rows) {
    console.log(
      `  ${row.kind.padEnd(18)} ${row.model.padEnd(20)} ${String(row.calls).padStart(6)} appels   ${dollars(row.costMicroUsd, 2).padStart(10)}   ${dollars(row.calls ? row.costMicroUsd / row.calls : 0)} par appel`,
    );
  }

  const sheetRows = rows.filter((row) => row.kind === "DRAFT_ANALYSIS");
  const sheetCalls = sheetRows.reduce((total, row) => total + row.calls, 0);
  const sheetCost = sheetRows.reduce((total, row) => total + row.costMicroUsd, 0);
  if (sheets > 0) {
    // Chaque fiche fait un appel pour les conditions de victoire, plus un pour le
    // duel quand il n'avait pas encore été écrit.
    const written = Math.min(sheets, Math.max(0, sheetCalls - sheets));
    console.log(`\n  Fiches écrites : ${sheets}`);
    console.log(`  Coût moyen d'une fiche : ${dollars(sheetCost / sheets)}`);
    console.log(`  Duels resservis : ${Math.round((1 - written / sheets) * 100)} %`);
  } else {
    console.log("\n  Aucune fiche sur la période.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
