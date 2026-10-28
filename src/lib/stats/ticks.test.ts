import { describe, expect, it } from "vitest";

import { minuteTicks } from "./ticks";

describe("repères de minutes", () => {
  it("marque toutes les 5 minutes, sans coller à la durée finale", () => {
    expect(minuteTicks(32.25)).toEqual([5, 10, 15, 20, 25]);
    expect(minuteTicks(15)).toEqual([5, 10]);
  });

  it("passe à 10 minutes pour une longue partie", () => {
    expect(minuteTicks(45)).toEqual([10, 20, 30]);
  });

  it("ne marque rien pour une partie très courte", () => {
    expect(minuteTicks(3.5)).toEqual([]);
  });
});
