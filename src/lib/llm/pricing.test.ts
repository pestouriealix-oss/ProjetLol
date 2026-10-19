import { describe, expect, it } from "vitest";

import { costMicroUsd } from "./pricing";

describe("costMicroUsd", () => {
  it("compte une fiche Sonnet typique autour de 2 centimes", () => {
    const cost = costMicroUsd({
      model: "claude-sonnet-5-5",
      inputTokens: 3500,
      outputTokens: 1200,
      cacheWriteTokens: 0,
      cacheReadTokens: 0,
    });
    expect(cost).toBe(3500 * 2 + 1200 * 10);
    expect(cost / 1e6).toBeCloseTo(0.019, 3);
  });

  it("facture le cache moins cher que l'entrée normale", () => {
    const base = { model: "claude-haiku-5-5", inputTokens: 0, outputTokens: 0 };
    expect(costMicroUsd({ ...base, cacheWriteTokens: 0, cacheReadTokens: 1000 })).toBeLessThan(
      costMicroUsd({ ...base, inputTokens: 1000, cacheWriteTokens: 0, cacheReadTokens: 0 }),
    );
  });

  it("ne compte rien pour un modèle inconnu", () => {
    expect(
      costMicroUsd({
        model: "inconnu",
        inputTokens: 1,
        outputTokens: 1,
        cacheWriteTokens: 0,
        cacheReadTokens: 0,
      }),
    ).toBe(0);
  });
});
