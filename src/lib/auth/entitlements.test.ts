import { describe, expect, it } from "vitest";

import { canLinkRiotAccount, effectivePlan, isPaidPlan, limitsFor } from "./entitlements";

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

describe("Premium offert (offre fondateurs)", () => {
  const now = new Date("2027-01-10T12:00:00Z");
  const later = new Date("2027-01-24T12:00:00Z");
  const before = new Date("2027-01-01T12:00:00Z");

  it("donne Premium jusqu'à la date, puis rend l'offre gratuite", () => {
    expect(effectivePlan("FREE", later, now)).toEqual({ plan: "PREMIUM", trialEndsAt: later });
    expect(effectivePlan("FREE", before, now)).toEqual({ plan: "FREE", trialEndsAt: null });
    expect(effectivePlan("FREE", null, now)).toEqual({ plan: "FREE", trialEndsAt: null });
  });

  it("ne montre pas d'essai à un abonné payant", () => {
    expect(effectivePlan("PREMIUM", later, now)).toEqual({ plan: "PREMIUM", trialEndsAt: null });
  });
});
