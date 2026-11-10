import { describe, expect, it } from "vitest";

import {
  FOUNDERS_MONTH_CENTS,
  formatPremiumPrice,
  formatYearlyPerMonth,
  PREMIUM_PRICES,
  yearlySavingPercent,
} from "./plans";

const nbsp = (text: string) => text.replace(/\s/g, " ");

describe("prix de Premium", () => {
  it("affiche le mois et l'année en euros", () => {
    expect(nbsp(formatPremiumPrice())).toBe("3,99 €");
    expect(nbsp(formatPremiumPrice("year"))).toBe("29,99 €");
  });

  it("garde 2,99 € au mois pour les fondateurs, et le même annuel", () => {
    expect(nbsp(formatPremiumPrice("month", { founder: true }))).toBe("2,99 €");
    expect(nbsp(formatPremiumPrice("year", { founder: true }))).toBe("29,99 €");
  });

  it("ramène l'annuel au mois et dit ce qu'il fait gagner", () => {
    expect(nbsp(formatYearlyPerMonth())).toBe("2,50 €");
    expect(yearlySavingPercent()).toBe(37);
    expect(yearlySavingPercent({ founder: true })).toBe(16);
  });

  it("l'annuel coûte moins que douze mois, même au prix fondateurs", () => {
    expect(PREMIUM_PRICES.year.amountCents).toBeLessThan(FOUNDERS_MONTH_CENTS * 12);
  });
});
