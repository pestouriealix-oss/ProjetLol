import { describe, expect, it } from "vitest";

import { spread } from "./spread";

describe("repères écartés", () => {
  it("ne touche pas aux repères assez espacés", () => {
    expect(spread([10, 40, 90], 12, 0, 100)).toEqual([10, 40, 90]);
  });

  it("écarte deux repères qui se chevauchent, autour de leur milieu", () => {
    expect(spread([50, 52], 12, 0, 100)).toEqual([45, 57]);
  });

  it("regroupe de proche en proche quand un groupe en touche un autre", () => {
    // 30 et 34 s'écartent en 26 et 38 : 38 touche alors 46, qui rejoint le groupe.
    expect(spread([30, 34, 46], 12, 0, 100)).toEqual([
      expect.closeTo(24.67, 2),
      expect.closeTo(36.67, 2),
      expect.closeTo(48.67, 2),
    ]);
  });

  it("garde l'ordre et l'écart minimal", () => {
    const placed = spread([5, 6, 7, 8, 60, 61], 10, 0, 200);
    for (let index = 1; index < placed.length; index += 1) {
      expect(placed[index]! - placed[index - 1]!).toBeGreaterThanOrEqual(10 - 1e-9);
    }
  });

  it("ramène dans le cadre un groupe qui dépasse d'un bord", () => {
    // Les tours du Nexus tombent à la dernière seconde, tout au bout de l'axe.
    expect(spread([98, 99, 100], 12, 4, 96)).toEqual([72, 84, 96]);
    expect(spread([0, 1], 12, 4, 96)).toEqual([4, 16]);
  });

  it("rend une liste vide telle quelle", () => {
    expect(spread([], 12, 0, 100)).toEqual([]);
  });
});
