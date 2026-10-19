import "server-only";

import type { Role } from "@/lib/config";
import { getChampionAssets } from "@/lib/ddragon/champions";
import { createChampionMatcher } from "@/lib/draft/champion-match";
import { assignRoles, type Draft, type DraftSide } from "@/lib/draft/draft";
import { assignTeamRoles } from "@/lib/stats/matchups";
import { llm, MODELS } from "@/lib/llm";
import {
  READ_DRAFT_SYSTEM,
  READ_DRAFT_TOOL,
  readDraftInstructions,
  type ReadDraft,
} from "@/lib/llm/prompts/read-draft";

import { CoachError } from "./errors";
import { loadRoleHints } from "./roles";

export const SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type ScreenshotType = (typeof SCREENSHOT_TYPES)[number];

export type ReadDraftResult = {
  draft: Draft;
  /** Joueurs vus sur la capture mais dont le champion n'a pas été reconnu. */
  unrecognized: number;
};

/**
 * Lit une capture de draft et la range dans le tableau : champions reconnus
 * (identifiants Data Dragon), rôles, et rôle du joueur s'il est mis en avant
 * sur l'image (sinon `fallbackRole`).
 */
export async function readDraftFromScreenshot(
  image: { data: string; mediaType: ScreenshotType },
  fallbackRole: Role,
): Promise<ReadDraftResult> {
  const champions = await getChampionAssets();
  if (!champions) throw new CoachError("champions_unavailable", "Data Dragon ne répond pas.");
  const list = champions.list();

  const read = await llm.callTool({
    model: MODELS.readDraft,
    system: READ_DRAFT_SYSTEM,
    maxTokens: 1000,
    tool: READ_DRAFT_TOOL,
    content: [
      { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } },
      { type: "text", text: readDraftInstructions(list) },
    ],
  });
  if (read.screen === "other")
    throw new CoachError("not_a_draft", "Ce n'est pas un écran de draft.");

  return toDraft(read, createChampionMatcher(list), fallbackRole, await loadRoleHints(champions));
}

/**
 * Pour placer les champions dont la capture ne montre pas le poste (souvent
 * l'équipe adverse) : numéro du champion et probabilité de chaque poste.
 */
export type RoleHints = {
  keyOf: (championId: string) => number | null;
  likelihood: (championKey: number, role: Role) => number | undefined;
};

/** Range une lecture du modèle dans le tableau (fonction pure, testée à part). */
export function toDraft(
  read: ReadDraft,
  match: (name: string) => string | null,
  fallbackRole: Role,
  hints?: RoleHints,
): ReadDraftResult {
  let unrecognized = 0;
  const picks = (side: ReadDraft["allies"]) =>
    side.map((pick) => {
      const champion = pick.champion.trim() ? match(pick.champion) : null;
      if (pick.champion.trim() && !champion) unrecognized += 1;
      return { champion, role: pick.role === "UNKNOWN" ? null : pick.role };
    });

  const place = (side: ReadDraft["allies"]): DraftSide => {
    const list = picks(side);
    const keyed = list.flatMap((pick) => {
      const key = pick.champion && hints ? hints.keyOf(pick.champion) : null;
      return pick.champion && key !== null ? [{ ...pick, champion: pick.champion, key }] : [];
    });
    // Postes manquants : la répartition la plus probable, postes lus sur l'image gardés.
    if (!hints || keyed.length !== list.filter((pick) => pick.champion).length) {
      return assignRoles(list);
    }
    if (keyed.every((pick) => pick.role !== null)) return assignRoles(list);
    const roles = assignTeamRoles(
      keyed.map((pick) => ({ champion: pick.key, smite: false })),
      (key, role) => {
        const known = keyed.find((pick) => pick.key === key)?.role;
        return known ? (known === role ? 1 : 0) : hints.likelihood(key, role);
      },
    );
    return assignRoles(
      keyed.map((pick) => ({ champion: pick.champion, role: roles.get(pick.key) ?? null })),
    );
  };

  const allies = place(read.allies);
  const enemies = place(read.enemies);

  // Le joueur mis en avant : son rôle est celui où son champion a été rangé.
  const mine = read.playerSlot >= 0 ? read.allies[read.playerSlot] : undefined;
  const mineId = mine ? match(mine.champion) : null;
  const myRole =
    (mineId && (Object.keys(allies) as Role[]).find((role) => allies[role] === mineId)) ||
    fallbackRole;

  return { draft: { allies, enemies, myRole }, unrecognized };
}
