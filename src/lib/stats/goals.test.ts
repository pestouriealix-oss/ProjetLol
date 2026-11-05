import { describe, expect, it } from "vitest";

import {
  buildTrend,
  defaultTrendRole,
  goalProgress,
  meetsGoal,
  metricValue,
  normalizeGoal,
  type PlayedGame,
  type SetGoal,
} from "./goals";

const game = (
  overrides: Partial<PlayedGame> & { matchId: string; startedAt: Date },
): PlayedGame => ({
  role: "MID",
  win: true,
  championName: "Ahri",
  durationSeconds: 30 * 60,
  cs: 210,
  deaths: 3,
  killParticipation: 0.55,
  visionScore: 30,
  damageToChampions: 21_000,
  controlWards: 2,
  ...overrides,
});

const day = (n: number) => new Date(Date.UTC(2026, 10, n, 20));

const goal = (overrides: Partial<SetGoal> = {}): SetGoal => ({
  reviewId: "r1",
  matchId: "EUW1_1",
  role: "MID",
  championName: "Ahri",
  metric: "CS_PER_MINUTE",
  target: 7.5,
  text: "7,5 CS par minute : prends chaque vague avant de bouger.",
  setAt: day(1),
  ...overrides,
});

describe("normalizeGoal", () => {
  it("ramène la cible dans les bornes, à la précision de l'indicateur", () => {
    expect(normalizeGoal({ metric: "CS_PER_MINUTE", target: 6.54 })).toEqual({
      metric: "CS_PER_MINUTE",
      target: 6.5,
    });
    expect(normalizeGoal({ metric: "DEATHS", target: 3.6 }).target).toBe(4);
    expect(normalizeGoal({ metric: "KILL_PARTICIPATION", target: 140 }).target).toBe(95);
    expect(normalizeGoal({ metric: "CONTROL_WARDS", target: 0 }).target).toBe(1);
    expect(normalizeGoal({ metric: "DAMAGE_PER_MINUTE", target: 648 }).target).toBe(650);
    expect(normalizeGoal({ metric: "VISION_PER_MINUTE", target: Number.NaN }).target).toBe(0.2);
  });
});

describe("metricValue et meetsGoal", () => {
  const played = game({ matchId: "EUW1_2", startedAt: day(2) });

  it("calcule chaque indicateur dans l'unité de sa cible", () => {
    expect(metricValue("CS_PER_MINUTE", played)).toBe(7);
    expect(metricValue("DEATHS", played)).toBe(3);
    expect(metricValue("KILL_PARTICIPATION", played)).toBe(55);
    expect(metricValue("VISION_PER_MINUTE", played)).toBe(1);
    expect(metricValue("CONTROL_WARDS", played)).toBe(2);
    expect(metricValue("DAMAGE_PER_MINUTE", played)).toBe(700);
    expect(metricValue("CONTROL_WARDS", { ...played, controlWards: null })).toBeNull();
  });

  it("compare à la précision affichée, dans le sens de l'indicateur", () => {
    // 7,46 CS par minute s'affiche 7,5 : la cible de 7,5 est tenue.
    const close = { ...played, cs: Math.round(7.46 * 30) };
    expect(
      meetsGoal({ metric: "CS_PER_MINUTE", target: 7.5 }, metricValue("CS_PER_MINUTE", close)!),
    ).toBe(true);
    expect(meetsGoal({ metric: "DEATHS", target: 3 }, 3)).toBe(true);
    expect(meetsGoal({ metric: "DEATHS", target: 3 }, 4)).toBe(false);
  });
});

describe("goalProgress", () => {
  const games: PlayedGame[] = [
    // Avant l'objectif : ne compte pas.
    game({ matchId: "EUW1_1", startedAt: new Date(day(1).getTime() - 3_600_000), cs: 300 }),
    game({ matchId: "EUW1_2", startedAt: day(2), cs: 240 }), // 8,0 : tenu
    game({ matchId: "EUW1_3", startedAt: day(3), cs: 180 }), // 6,0 : manqué
    game({ matchId: "EUW1_4", startedAt: day(4), role: "SUPPORT", cs: 20 }), // autre poste
    game({ matchId: "EUW1_5", startedAt: day(5), durationSeconds: 200, cs: 1 }), // remake
    game({ matchId: "EUW1_6", startedAt: day(7), cs: 250 }), // après l'objectif suivant
  ];

  it("vérifie chaque objectif sur les parties où il était en cours, au même poste", () => {
    const next = goal({ reviewId: "r2", metric: "DEATHS", target: 2, setAt: day(6) });
    const [latest, previous] = goalProgress([goal(), next], games);

    expect(latest?.goal.reviewId).toBe("r2");
    expect(latest?.current).toBe(true);
    expect(latest?.checks.map((check) => check.matchId)).toEqual(["EUW1_6"]);
    expect(latest?.met).toBe(0);

    expect(previous?.current).toBe(false);
    expect(previous?.checks.map((check) => [check.matchId, check.met])).toEqual([
      ["EUW1_3", false],
      ["EUW1_2", true],
    ]);
    expect(previous?.met).toBe(1);
  });

  it("n'a rien à vérifier tant qu'aucune partie n'a suivi", () => {
    const [only] = goalProgress([goal({ setAt: day(9) })], games);
    expect(only).toMatchObject({ checks: [], met: 0, current: true });
  });
});

describe("buildTrend", () => {
  const series = (values: number[]) =>
    values.map((cs, index) =>
      game({ matchId: `EUW1_${index}`, startedAt: day(index + 1), cs: cs * 30 }),
    );

  it("ordonne les parties de la plus ancienne à la plus récente et donne la moyenne", () => {
    const trend = buildTrend("CS_PER_MINUTE", series([6, 7, 8]).reverse(), "MID");
    expect(trend?.points.map((point) => point.value)).toEqual([6, 7, 8]);
    expect(trend?.average).toBe(7);
    expect(trend?.recent).toBeNull();
  });

  it("compare les cinq dernières parties aux précédentes, dans le bon sens", () => {
    const cs = buildTrend("CS_PER_MINUTE", series([6, 6, 6, 6, 6, 7, 7, 7, 7, 7]), "MID");
    expect(cs?.recent).toEqual({ average: 7, earlier: 6, better: true });

    const deaths = buildTrend(
      "DEATHS",
      [3, 3, 3, 3, 3, 6, 6, 6, 6, 6].map((deaths, index) =>
        game({ matchId: `EUW1_${index}`, startedAt: day(index + 1), deaths }),
      ),
      "MID",
    );
    expect(deaths?.recent?.better).toBe(false);
  });

  it("ne trace rien avec trop peu de parties à ce poste", () => {
    expect(buildTrend("CS_PER_MINUTE", series([6, 7]), "MID")).toBeNull();
    expect(buildTrend("CS_PER_MINUTE", series([6, 7, 8]), "TOP")).toBeNull();
  });
});

describe("defaultTrendRole", () => {
  it("prend le poste de l'objectif, sinon le plus joué", () => {
    const games = [
      game({ matchId: "a", startedAt: day(1), role: "TOP" }),
      game({ matchId: "b", startedAt: day(2), role: "MID" }),
      game({ matchId: "c", startedAt: day(3), role: "MID" }),
    ];
    expect(defaultTrendRole(games, "SUPPORT")).toBe("SUPPORT");
    expect(defaultTrendRole(games, null)).toBe("MID");
    expect(defaultTrendRole([], null)).toBeNull();
  });
});
