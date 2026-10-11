import { z } from "zod";

import { t } from "@/i18n/fr";
import { MAX_ROLES_PER_ACCOUNT, PLATFORM_IDS, ROLES } from "@/lib/config";

const errors = t.settings.riot.errors;

export type RiotId = { gameName: string; tagLine: string };

export type RiotIdParseResult = { ok: true; value: RiotId } | { ok: false; error: string };

/**
 * Découpe un Riot ID « Pseudo#TAG ».
 * Règles Riot : pseudo de 3 à 16 caractères, tag de 3 à 5 lettres ou chiffres.
 * Le pseudo peut contenir des espaces et des lettres accentuées, pas de dièse.
 */
export function parseRiotId(input: string): RiotIdParseResult {
  const parts = input.trim().split("#");
  if (parts.length !== 2) return { ok: false, error: errors.riotIdFormat };

  const gameName = (parts[0] ?? "").trim().replace(/\s+/g, " ");
  const tagLine = (parts[1] ?? "").trim();

  // Longueur comptée en caractères visibles, pas en unités UTF-16.
  const gameNameLength = [...gameName].length;
  if (gameNameLength < 3 || gameNameLength > 16) {
    return { ok: false, error: errors.gameNameLength };
  }
  if (!/^[\p{L}\p{N}]{3,5}$/u.test(tagLine)) {
    return { ok: false, error: errors.tagLineFormat };
  }
  return { ok: true, value: { gameName, tagLine } };
}

export function formatRiotId({ gameName, tagLine }: RiotId): string {
  return `${gameName}#${tagLine}`;
}

export const rolesSchema = z
  .array(z.enum(ROLES))
  .max(MAX_ROLES_PER_ACCOUNT, { error: errors.tooManyRoles })
  .transform((roles) => ROLES.filter((role) => roles.includes(role)));

export const addRiotAccountSchema = z.object({
  riotId: z.string().transform((value, ctx) => {
    const result = parseRiotId(value);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.error });
      return z.NEVER;
    }
    return result.value;
  }),
  platform: z.enum(PLATFORM_IDS, { error: errors.platformInvalid }),
  roles: rolesSchema,
});

export type AddRiotAccountInput = z.infer<typeof addRiotAccountSchema>;
