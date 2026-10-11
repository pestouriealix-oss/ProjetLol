import { describe, expect, it } from "vitest";

import { canLinkRiotAccount, isPaidPlan, limitsFor } from "./entitlements";

describe("entitlements", () => {
  it("l'offre Premium n'est jamais plus restrictive que l'offre gratuite", () => {
    const free = limitsFor("FREE");
    const premium = limitsFor("PREMIUM");
    for (const key of Object.keys(free) as (keyof typeof free)[]) {
      expect(premium[key]).toBeGreaterThanOrEqual(free[key]);
    }
  });

  it("autorise l'ajout d'un compte jusqu'à la limite, pas au-delà", () => {
    const max = limitsFor("FREE").riotAccounts;
    expect(canLinkRiotAccount("FREE", max - 1)).toBe(true);
    expect(canLinkRiotAccount("FREE", max)).toBe(false);
  });

  it("distingue l'offre gratuite des offres payantes", () => {
    expect(isPaidPlan("FREE")).toBe(false);
    expect(isPaidPlan("PREMIUM")).toBe(true);
  });
});
