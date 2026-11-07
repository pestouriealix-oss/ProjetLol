import { describe, expect, it } from "vitest";

import {
  formatPremiumPrice,
  formatYearlyPerMonth,
  PREMIUM_PRICES,
  yearlySavingPercent,
} from "./plans";

const nbsp = (text: string) => text.replace(/\s/g, " ");

describe("prix de Premium", () => {
  it("affiche le mois et l'année en euros", () => {
    expect(nbsp(formatPremiumPrice())).toBe("2,99 €");
    expect(nbsp(formatPremiumPrice("year"))).toBe("24,99 €");
  });

  it("ramène l'annuel au mois et dit ce qu'il fait gagner", () => {
    expect(nbsp(formatYearlyPerMonth())).toBe("2,08 €");
    expect(yearlySavingPercent()).toBe(30);
  });

  it("l'annuel coûte moins que douze mois", () => {
    expect(PREMIUM_PRICES.year.amountCents).toBeLessThan(PREMIUM_PRICES.month.amountCents * 12);
  });
});
