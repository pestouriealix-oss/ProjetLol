import { describe, expect, it } from "vitest";

import { addRiotAccountSchema, formatRiotId, parseRiotId, rolesSchema } from "./riot";

describe("parseRiotId", () => {
  it("découpe un Riot ID valide", () => {
    expect(parseRiotId("Akiixxx#EUWW")).toEqual({
      ok: true,
      value: { gameName: "Akiixxx", tagLine: "EUWW" },
    });
  });

  it("nettoie les espaces autour et à l'intérieur", () => {
    expect(parseRiotId("  Hide  on   bush #KR1 ")).toEqual({
      ok: true,
      value: { gameName: "Hide on bush", tagLine: "KR1" },
    });
  });

  it("accepte les lettres accentuées et non latines", () => {
    expect(parseRiotId("Éloïse 페이커#0001").ok).toBe(true);
  });

  it.each([
    ["sans dièse", "Akiixxx"],
    ["deux dièses", "Aki#ix#EUW"],
    ["pseudo trop court", "ab#EUW"],
    ["pseudo trop long", "abcdefghijklmnopq#EUW"],
    ["tag trop court", "Akiixxx#EU"],
    ["tag trop long", "Akiixxx#EUWEST"],
    ["tag avec symbole", "Akiixxx#EU-W"],
    ["chaîne vide", ""],
  ])("refuse : %s", (_label, input) => {
    expect(parseRiotId(input).ok).toBe(false);
  });

  it("compte les caractères visibles, pas les unités UTF-16", () => {
    // 16 émojis = 32 unités UTF-16, mais bien 16 caractères.
    expect(parseRiotId(`${"🔥".repeat(16)}#EUW`).ok).toBe(true);
    expect(parseRiotId(`${"🔥".repeat(17)}#EUW`).ok).toBe(false);
  });
});

describe("formatRiotId", () => {
  it("est l'inverse de parseRiotId", () => {
    const parsed = parseRiotId("Akiixxx#EUWW");
    expect(parsed.ok && formatRiotId(parsed.value)).toBe("Akiixxx#EUWW");
  });
});

describe("rolesSchema", () => {
  it("remet les rôles dans l'ordre canonique", () => {
    expect(rolesSchema.parse(["SUPPORT", "JUNGLE"])).toEqual(["JUNGLE", "SUPPORT"]);
  });

  it("accepte aucun rôle", () => {
    expect(rolesSchema.parse([])).toEqual([]);
  });

  it("refuse plus de deux rôles et les rôles inconnus", () => {
    expect(rolesSchema.safeParse(["TOP", "MID", "ADC"]).success).toBe(false);
    expect(rolesSchema.safeParse(["FEEDER"]).success).toBe(false);
  });
});

describe("addRiotAccountSchema", () => {
  it("valide une saisie complète", () => {
    const result = addRiotAccountSchema.safeParse({
      riotId: "Akiixxx#EUWW",
      platform: "EUW1",
      roles: ["JUNGLE"],
    });
    expect(result.success && result.data).toEqual({
      riotId: { gameName: "Akiixxx", tagLine: "EUWW" },
      platform: "EUW1",
      roles: ["JUNGLE"],
    });
  });

  it("refuse un serveur inconnu", () => {
    const result = addRiotAccountSchema.safeParse({
      riotId: "Akiixxx#EUWW",
      platform: "MARS1",
      roles: [],
    });
    expect(result.success).toBe(false);
  });
});
