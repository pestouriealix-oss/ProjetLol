import { describe, expect, it } from "vitest";

import { formatInviteCode, generateInviteCode, normalizeInviteCode } from "./invite-code";

describe("codes d'invitation", () => {
  it("génère des codes de 8 caractères faciles à recopier", () => {
    for (let index = 0; index < 50; index += 1) {
      const code = generateInviteCode();
      expect(code).toMatch(/^[A-HJKMNP-Z2-9]{8}$/);
      expect(normalizeInviteCode(code)).toBe(code);
    }
  });

  it("accepte la saisie en minuscules, avec espaces ou tiret", () => {
    expect(normalizeInviteCode(" k7qm-2xpa ")).toBe("K7QM2XPA");
    expect(normalizeInviteCode("K7QM 2XPA")).toBe("K7QM2XPA");
  });

  it("refuse ce qui ne peut pas être un code", () => {
    expect(normalizeInviteCode("")).toBeNull();
    expect(normalizeInviteCode("K7QM2XP")).toBeNull();
    // Caractères exclus parce qu'ils se confondent : O, 0, I, 1, L.
    expect(normalizeInviteCode("K7QM2XP0")).toBeNull();
    expect(normalizeInviteCode("K7QM2XPI")).toBeNull();
  });

  it("affiche le code en deux groupes", () => {
    expect(formatInviteCode("K7QM2XPA")).toBe("K7QM-2XPA");
  });
});
