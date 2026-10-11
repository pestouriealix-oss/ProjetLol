import { describe, expect, it } from "vitest";

import {
  advantageAt,
  createInterpolator,
  createPowerCurves,
  findCrossovers,
  samplePowerCurves,
  type PowerSeries,
} from "./power-curve";

/** Forts tôt, dépassés ensuite : la bascule est posée à 25 minutes. */
const EARLY_GAME: PowerSeries = [
  { minute: 0, ours: 62, theirs: 34 },
  { minute: 8, ours: 78, theirs: 38 },
  { minute: 15, ours: 74, theirs: 46 },
  { minute: 25, ours: 56, theirs: 56 },
  { minute: 33, ours: 40, theirs: 74 },
  { minute: 40, ours: 32, theirs: 84 },
];

describe("createInterpolator", () => {
  const points = [
    { x: 0, y: 10 },
    { x: 10, y: 50 },
    { x: 20, y: 50 },
    { x: 30, y: 90 },
  ];
  const interpolate = createInterpolator(points);

  it("passe exactement par les points de repère", () => {
    for (const point of points) expect(interpolate(point.x)).toBeCloseTo(point.y, 10);
  });

  it("ne dépasse jamais les valeurs données", () => {
    for (let x = 0; x <= 30; x += 0.1) {
      const y = interpolate(x);
      expect(y).toBeGreaterThanOrEqual(10 - 1e-9);
      expect(y).toBeLessThanOrEqual(90 + 1e-9);
    }
  });

  it("reste monotone quand les données le sont", () => {
    let previous = interpolate(0);
    for (let x = 0.1; x <= 30; x += 0.1) {
      const y = interpolate(x);
      expect(y).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = y;
    }
  });

  it("garde un palier plat entre deux valeurs égales", () => {
    expect(interpolate(15)).toBeCloseTo(50, 10);
  });

  it("prolonge par la valeur du bord en dehors du domaine", () => {
    expect(interpolate(-5)).toBe(10);
    expect(interpolate(99)).toBe(90);
  });

  it("refuse des points insuffisants ou désordonnés", () => {
    expect(() => createInterpolator([{ x: 0, y: 0 }])).toThrow();
    expect(() =>
      createInterpolator([
        { x: 5, y: 0 },
        { x: 5, y: 1 },
      ]),
    ).toThrow();
  });
});

describe("samplePowerCurves", () => {
  it("couvre tout le domaine, bornes comprises", () => {
    const samples = samplePowerCurves(createPowerCurves(EARLY_GAME), 0.5);
    expect(samples).toHaveLength(81);
    expect(samples[0]).toMatchObject({ minute: 0, ours: 62, theirs: 34 });
    expect(samples.at(-1)).toMatchObject({ minute: 40, ours: 32, theirs: 84 });
  });
});

describe("findCrossovers", () => {
  it("trouve la bascule d'une composition forte en début de partie", () => {
    const crossovers = findCrossovers(createPowerCurves(EARLY_GAME));
    expect(crossovers).toHaveLength(1);
    expect(crossovers[0]).toBeCloseTo(25, 1);
  });

  it("ne trouve rien quand une équipe domine toute la partie", () => {
    const curves = createPowerCurves([
      { minute: 0, ours: 70, theirs: 40 },
      { minute: 40, ours: 80, theirs: 60 },
    ]);
    expect(findCrossovers(curves)).toEqual([]);
  });

  it("trouve une bascule entre deux échantillons", () => {
    const curves = createPowerCurves([
      { minute: 0, ours: 40, theirs: 60 },
      { minute: 10, ours: 60, theirs: 40 },
    ]);
    const crossovers = findCrossovers(curves);
    expect(crossovers).toHaveLength(1);
    expect(crossovers[0]).toBeCloseTo(5, 6);
  });

  it("ne compte pas un simple contact comme une bascule", () => {
    const curves = createPowerCurves([
      { minute: 0, ours: 70, theirs: 50 },
      { minute: 10, ours: 60, theirs: 60 },
      { minute: 20, ours: 70, theirs: 50 },
    ]);
    expect(findCrossovers(curves)).toEqual([]);
  });

  it("trouve plusieurs bascules", () => {
    const curves = createPowerCurves([
      { minute: 0, ours: 60, theirs: 40 },
      { minute: 15, ours: 40, theirs: 60 },
      { minute: 30, ours: 60, theirs: 40 },
    ]);
    expect(findCrossovers(curves)).toHaveLength(2);
  });
});

describe("advantageAt", () => {
  const curves = createPowerCurves(EARLY_GAME);

  it("annonce un net avantage pour nous en début de partie", () => {
    expect(advantageAt(curves, 8)).toMatchObject({ leader: "ours", strength: "clear" });
  });

  it("annonce l'équilibre autour de la bascule", () => {
    expect(advantageAt(curves, 25)).toMatchObject({ leader: "even", strength: null });
  });

  it("annonce un léger avantage juste après la bascule", () => {
    expect(advantageAt(curves, 27)).toMatchObject({ leader: "theirs", strength: "slight" });
  });

  it("annonce un net avantage pour eux en fin de partie", () => {
    expect(advantageAt(curves, 38)).toMatchObject({ leader: "theirs", strength: "clear" });
  });
});
