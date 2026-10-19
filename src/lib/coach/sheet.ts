import "server-only";

import { limitsFor } from "@/lib/auth/entitlements";
import { ROLES, type Plan, type Role } from "@/lib/config";
import { countDraftAnalysesSince, createDraftAnalysis } from "@/lib/db/draft-analyses";
import { listLatestRanks } from "@/lib/db/ranks";
import { listRiotAccounts } from "@/lib/db/riot-accounts";
import { getChampionAssets } from "@/lib/ddragon/champions";
import { canAnalyse, duplicateChampions, type Draft } from "@/lib/draft/draft";
import { frenchSpacing } from "@/lib/format";
import { llm, MODELS } from "@/lib/llm";
import {
  DRAFT_SHEET_SYSTEM,
  DRAFT_SHEET_TOOL,
  DRAFT_SHEET_VERSION,
  draftSheetMessage,
  type DraftSheet,
} from "@/lib/llm/prompts/draft-sheet";
import { t } from "@/i18n/fr";

import { CoachError } from "./errors";

export type { DraftSheet };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Fiches encore possibles sur les dernières 24 heures, selon l'offre. */
export async function remainingSheets(userId: string, plan: Plan, now = new Date()) {
  const limit = limitsFor(plan).draftAnalysesPerDay;
  const used = await countDraftAnalysesSince(userId, new Date(now.getTime() - DAY_MS));
  return { limit, used, remaining: Math.max(0, limit - used) };
}

/** « 16.20.1 » → « 16.20 ». */
const patchOf = (version: string) => version.split(".").slice(0, 2).join(".");

/** Espaces insécables de la typographie française dans tous les textes de la fiche. */
function tidy(sheet: DraftSheet): DraftSheet {
  return {
    winConditions: {
      ours: frenchSpacing(sheet.winConditions.ours),
      theirs: frenchSpacing(sheet.winConditions.theirs),
    },
    matchup: {
      ...sheet.matchup,
      summary: frenchSpacing(sheet.matchup.summary),
      keyMoments: frenchSpacing(sheet.matchup.keyMoments),
      options: sheet.matchup.options.map((option) => ({
        title: frenchSpacing(option.title),
        detail: frenchSpacing(option.detail),
      })),
      watchOut: frenchSpacing(sheet.matchup.watchOut),
    },
  };
}

/**
 * Écrit la fiche d'une draft avec le modèle, en la diffusant morceau par
 * morceau (`onPartial`), puis l'enregistre. Renvoie l'identifiant de la fiche.
 */
export async function writeDraftSheet(
  userId: string,
  draft: Draft,
  onPartial: (partial: unknown) => void,
  signal?: AbortSignal,
): Promise<{ id: string; sheet: DraftSheet }> {
  const champions = await getChampionAssets();
  if (!champions) throw new CoachError("champions_unavailable", "Data Dragon ne répond pas.");
  const known = new Set(champions.list().map((champion) => champion.id));
  const picked = [...Object.values(draft.allies), ...Object.values(draft.enemies)].filter(
    (id): id is string => id !== null,
  );
  if (
    !canAnalyse(draft) ||
    duplicateChampions(draft).length > 0 ||
    picked.some((id) => !known.has(id))
  ) {
    throw new CoachError("invalid_draft", "Draft incomplète ou incohérente.");
  }

  const names = (side: Draft["allies"]) =>
    Object.fromEntries(
      ROLES.map((role) => [role, side[role] ? champions.name(side[role]) : null]),
    ) as Record<Role, string | null>;

  // Le classement du compte principal oriente le niveau des conseils.
  const [account] = await listRiotAccounts(userId);
  const solo = account
    ? (await listLatestRanks(userId, account.id)).find((rank) => rank.queue === "RANKED_SOLO_5x5")
    : undefined;
  const rank = solo ? (t.dashboard.rank.tiers[solo.tier] ?? solo.tier) : null;

  const patch = patchOf(champions.version);
  const sheet = tidy(
    await llm.streamTool(
      {
        model: MODELS.draftSheet,
        system: DRAFT_SHEET_SYSTEM,
        maxTokens: 2000,
        tool: DRAFT_SHEET_TOOL,
        content: draftSheetMessage({
          patch,
          myRole: draft.myRole,
          allies: names(draft.allies),
          enemies: names(draft.enemies),
          rank,
        }),
      },
      onPartial,
      signal,
    ),
  );

  const id = await createDraftAnalysis(userId, {
    riotAccountId: account?.id ?? null,
    patch,
    myChampion: draft.allies[draft.myRole] ?? "",
    myRole: draft.myRole,
    allies: draft.allies,
    enemies: draft.enemies,
    content: sheet,
    promptVersion: DRAFT_SHEET_VERSION,
  });
  return { id, sheet };
}
