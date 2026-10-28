import { describe, expect, it } from "vitest";

import { APEX_FLOOR, divisionFloors, ladderPoints, rankHistory } from "./ladder";

describe("échelle classée", () => {
  it("met chaque rang à plat, division par division", () => {
    expect(ladderPoints("IRON", "IV", 0)).toBe(0);
    expect(ladderPoints("SILVER", "IV", 71)).toBe(871);
    expect(ladderPoints("DIAMOND", "I", 99)).toBe(2799);
    expect(ladderPoints("MASTER", "I", 120)).toBe(APEX_FLOOR + 120);
    expect(ladderPoints("INCONNU", "I", 0)).toBeNull();
  });

  it("place les repères de division au début de chaque division, sauf la IV", () => {
    const floors = divisionFloors();
    expect(floors).toHaveLength(7 * 3);
    expect(floors.find((floor) => floor.tier === "SILVER" && floor.division === "II")?.points).toBe(
      ladderPoints("SILVER", "II", 0),
    );
    expect(floors.some((floor) => floor.division === "IV")).toBe(false);
  });

  it("ne garde que les changements, et prolonge la courbe jusqu'au dernier relevé", () => {
    const at = (day: number) => new Date(Date.UTC(2026, 9, day));
    const history = rankHistory([
      { takenAt: at(3), tier: "SILVER", division: "IV", lp: 71 },
      { takenAt: at(1), tier: "SILVER", division: "IV", lp: 50 },
      { takenAt: at(2), tier: "SILVER", division: "IV", lp: 71 },
      { takenAt: at(4), tier: "SILVER", division: "IV", lp: 71 },
    ]);
    expect(history.map((point) => [point.at.getUTCDate(), point.lp])).toEqual([
      [1, 50],
      [2, 71],
      [4, 71],
    ]);
  });
});
