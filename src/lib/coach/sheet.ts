import "server-only";

import { limitsFor } from "@/lib/auth/entitlements";
import { ROLES, type Plan, type Role } from "@/lib/config";
import { countDraftAnalysesSince, createDraftAnalysis } from "@/lib/db/draft-analyses";
import { findMatchupNote, saveMatchupNote } from "@/lib/db/matchup-notes";
import { listLatestRanks } from "@/lib/db/ranks";
import { listRiotAccounts } from "@/lib/db/riot-accounts";
import { getChampionAssets } from "@/lib/ddragon/champions";
import type { ChampionDetails } from "@/lib/ddragon/champion-details";
import { canAnalyse, duplicateChampions, type Draft } from "@/lib/draft/draft";
import type { SheetFacts } from "@/lib/draft/sheet-view";
import { frenchSpacing } from "@/lib/format";
import { llm, MODELS } from "@/lib/llm";
import {
  DRAFT_MATCHUP_SYSTEM,
  DRAFT_MATCHUP_TOOL,
  DRAFT_MATCHUP_VERSION,
  draftMatchupMessage,
  matchupSchema,
  type Matchup,
} from "@/lib/llm/prompts/draft-matchup";
import { DRAFT_SHEET_VERSION, type DraftSheet } from "@/lib/llm/prompts/draft-sheet";
import {
  WIN_CONDITIONS_SYSTEM,
  WIN_CONDITIONS_TOOL,
  winConditionsMessage,
  type WinConditions,
} from "@/lib/llm/prompts/win-conditions";
import { statsVerdict } from "@/lib/stats/matchups";
import { t } from "@/i18n/fr";

import { CoachError } from "./errors";
import { loadMatchupFacts } from "./facts";
import { lanePartnerRole, matchupNoteKey } from "./matchup-key";
import { trackUsage } from "./usage";

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

/** Espaces insécables de la typographie française dans les textes de la fiche. */
const tidyWinConditions = (value: WinConditions): WinConditions => ({
  ours: frenchSpacing(value.ours),
  theirs: frenchSpacing(value.theirs),
});

const tidyMatchup = (value: Matchup): Matchup => ({
  ...value,
  summary: frenchSpacing(value.summary),
  keyMoments: frenchSpacing(value.keyMoments),
  options: value.options.map((option) => ({
    title: frenchSpacing(option.title),
    detail: frenchSpacing(option.detail),
  })),
  watchOut: frenchSpacing(value.watchOut),
});

/**
 * Écrit la fiche d'une draft avec le modèle, en la diffusant morceau par
 * morceau (`onPartial`), puis l'enregistre. Renvoie l'identifiant de la fiche.
 *
 * Deux appels partent en même temps : les conditions de victoire (propres à
 * cette partie) et le duel. Le duel ne dépend que des deux champions : s'il a
 * déjà été écrit pour ce patch, il s'affiche aussitôt et ne coûte rien.
 */
export async function writeDraftSheet(
  userId: string,
  draft: Draft,
  onPartial: (partial: unknown) => void,
  signal?: AbortSignal,
  /** Reçoit les données vérifiées dès qu'elles sont connues, avant l'écriture. */
  onFacts: (facts: SheetFacts) => void = () => {},
): Promise<{ id: string; sheet: DraftSheet; facts: SheetFacts }> {
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
  const myId = draft.allies[draft.myRole]!;
  const theirId = draft.enemies[draft.myRole]!;
  const grounded = await loadMatchupFacts({
    ddragonVersion: champions.version,
    role: draft.myRole,
    mine: { id: myId, key: champions.keyOf(myId) },
    theirs: { id: theirId, key: champions.keyOf(theirId) },
  });
  onFacts(grounded.facts);
  const sheetOf = (details: ChampionDetails | null) =>
    details ? { name: details.name, passive: details.passive, spells: details.spells } : null;
  const stats = grounded.facts.stats;

  const allyNames = names(draft.allies);
  const enemyNames = names(draft.enemies);
  const model = MODELS.draftSheet;
  const partnerRole = lanePartnerRole(draft.myRole);
  const partnerIds =
    partnerRole && draft.allies[partnerRole] && draft.enemies[partnerRole]
      ? { mine: draft.allies[partnerRole], theirs: draft.enemies[partnerRole] }
      : null;
  const key = matchupNoteKey({
    promptVersion: DRAFT_MATCHUP_VERSION,
    model,
    patch,
    role: draft.myRole,
    mine: myId,
    theirs: theirId,
    partners: partnerIds,
    statsVerdict: stats?.reliable ? statsVerdict(stats.matchup) : null,
  });
  const saved = matchupSchema.safeParse(await findMatchupNote(key));
  const cached = saved.success ? saved.data : null;

  // La fiche en cours : chaque appel remplit sa moitié.
  let current: { winConditions?: unknown; matchup?: unknown } = cached ? { matchup: cached } : {};
  const emit = () => onPartial(current);
  if (cached) emit();

  // Un appel qui échoue arrête l'autre : la fiche ne sera pas complète.
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const track = (usage: Parameters<typeof trackUsage>[2]) =>
    trackUsage(userId, "DRAFT_ANALYSIS", usage);

  const winTask = llm
    .streamTool(
      {
        model,
        system: WIN_CONDITIONS_SYSTEM,
        maxTokens: 600,
        tool: WIN_CONDITIONS_TOOL,
        onUsage: track,
        content: winConditionsMessage({
          patch,
          myRole: draft.myRole,
          allies: allyNames,
          enemies: enemyNames,
          rank,
        }),
      },
      (partial) => {
        current = { ...current, winConditions: partial };
        emit();
      },
      controller.signal,
    )
    .then(tidyWinConditions);

  const matchupTask = cached
    ? Promise.resolve(cached)
    : llm
        .streamTool(
          {
            model,
            system: DRAFT_MATCHUP_SYSTEM,
            maxTokens: 1500,
            tool: DRAFT_MATCHUP_TOOL,
            onUsage: track,
            content: draftMatchupMessage({
              patch,
              ddragonVersion: champions.version,
              role: draft.myRole,
              mine: allyNames[draft.myRole] ?? myId,
              theirs: enemyNames[draft.myRole] ?? theirId,
              partners:
                partnerRole && allyNames[partnerRole] && enemyNames[partnerRole]
                  ? { mine: allyNames[partnerRole], theirs: enemyNames[partnerRole] }
                  : null,
              champions: { mine: sheetOf(grounded.mine), theirs: sheetOf(grounded.theirs) },
              stats: stats
                ? {
                    patch: stats.patch,
                    matches: stats.matches,
                    duel: stats.matchup,
                    reliable: stats.reliable,
                    mineAtRole: grounded.roleRates.mine,
                    theirsAtRole: grounded.roleRates.theirs,
                  }
                : null,
            }),
          },
          (partial) => {
            current = { ...current, matchup: partial };
            emit();
          },
          controller.signal,
        )
        .then(tidyMatchup)
        .then(async (matchup) => {
          // Gardé pour les suivants ; un échec ici ne prive pas le joueur de sa fiche.
          await saveMatchupNote({
            key,
            patch,
            model,
            promptVersion: DRAFT_MATCHUP_VERSION,
            content: matchup,
          }).catch((error: unknown) => console.error("Duel non gardé", error));
          return matchup;
        });

  let sheet: DraftSheet;
  try {
    const [winConditions, matchup] = await Promise.all([winTask, matchupTask]);
    sheet = { winConditions, matchup };
  } catch (error) {
    abort();
    throw error;
  } finally {
    signal?.removeEventListener("abort", abort);
  }

  const id = await createDraftAnalysis(userId, {
    riotAccountId: account?.id ?? null,
    patch,
    myChampion: draft.allies[draft.myRole] ?? "",
    myRole: draft.myRole,
    allies: draft.allies,
    enemies: draft.enemies,
    content: { ...sheet, facts: grounded.facts },
    promptVersion: DRAFT_SHEET_VERSION,
  });
  return { id, sheet, facts: grounded.facts };
}
