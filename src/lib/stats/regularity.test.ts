import { describe, expect, it } from "vitest";

import { buildCalendar, dayKey, splitBySession, type DatedGame } from "./regularity";

const PARIS = "Europe/Paris";
// Samedi 14 novembre 2026, 19 h à Paris.
const TODAY = new Date("2026-11-14T18:00:00Z");

const game = (iso: string, win = true): DatedGame => ({ startedAt: new Date(iso), win });

describe("jour d'une partie", () => {
  it("compte à l'heure de Paris : 0 h 30 à Paris est déjà le lendemain", () => {
    expect(dayKey(new Date("2026-11-13T23:30:00Z"), PARIS)).toBe("2026-11-14");
    expect(dayKey(new Date("2026-07-13T21:30:00Z"), PARIS)).toBe("2026-07-13");
  });
});

describe("calendrier", () => {
  it("finit sur la semaine en cours, du lundi au dimanche", () => {
    const calendar = buildCalendar([], TODAY, PARIS, 4);
    expect(calendar.weeks).toHaveLength(4);
    const last = calendar.weeks.at(-1)!;
    expect(last.map((day) => day.key)).toEqual([
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
    ]);
    expect(last[6]!.future).toBe(true);
    expect(last[5]!.future).toBe(false);
    expect(calendar.weeks[0]![0]!.key).toBe("2026-10-19");
  });

  it("additionne les parties et les victoires de chaque jour", () => {
    const calendar = buildCalendar(
      [
        game("2026-11-12T10:00:00Z"),
        game("2026-11-12T11:00:00Z", false),
        game("2026-11-10T20:00:00Z"),
      ],
      TODAY,
      PARIS,
      2,
    );
    const days = calendar.weeks.at(-1)!;
    expect(days[3]).toMatchObject({ key: "2026-11-12", games: 2, wins: 1, level: 1 });
    expect(days[1]).toMatchObject({ key: "2026-11-10", games: 1, wins: 1 });
    expect(calendar.activeDays).toBe(2);
    expect(calendar.games).toBe(3);
  });

  it("gradue l'intensité de 0 à 4", () => {
    const many = (count: number) =>
      Array.from({ length: count }, (_, index) => game(`2026-11-11T${10 + index}:00:00Z`));
    const level = (count: number) =>
      buildCalendar(many(count), TODAY, PARIS, 1).weeks[0]![2]!.level;
    expect([0, 1, 2, 3, 4, 5, 7, 8, 12].map(level)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it("ignore les parties hors de la grille", () => {
    const calendar = buildCalendar([game("2025-01-01T12:00:00Z")], TODAY, PARIS, 2);
    expect(calendar.games).toBe(0);
  });

  it("mesure la plus longue série et la série en cours", () => {
    const calendar = buildCalendar(
      [
        // Trois jours d'affilée, une pause, puis vendredi et samedi.
        game("2026-11-03T12:00:00Z"),
        game("2026-11-04T12:00:00Z"),
        game("2026-11-05T12:00:00Z"),
        game("2026-11-13T12:00:00Z"),
        game("2026-11-14T12:00:00Z"),
      ],
      TODAY,
      PARIS,
      3,
    );
    expect(calendar.longestStreak).toBe(3);
    expect(calendar.currentStreak).toBe(2);
  });

  it("ne casse pas la série tant qu'aujourd'hui n'est pas joué", () => {
    const calendar = buildCalendar(
      [game("2026-11-12T12:00:00Z"), game("2026-11-13T12:00:00Z")],
      TODAY,
      PARIS,
      2,
    );
    expect(calendar.currentStreak).toBe(2);
  });

  it("remet la série à zéro après un jour sans partie", () => {
    const calendar = buildCalendar([game("2026-11-12T12:00:00Z")], TODAY, PARIS, 2);
    expect(calendar.currentStreak).toBe(0);
    expect(calendar.longestStreak).toBe(1);
  });
});

describe("premières parties de la journée contre les suivantes", () => {
  /** `days` journées de `perDay` parties ; les 3 premières gagnées, les autres perdues. */
  const sessions = (days: number, perDay: number) =>
    Array.from({ length: days }, (_, day) =>
      Array.from({ length: perDay }, (_, rank) =>
        game(
          `2026-10-${String(day + 1).padStart(2, "0")}T${String(8 + rank).padStart(2, "0")}:00:00Z`,
          rank < 3,
        ),
      ),
    ).flat();

  it("sépare les trois premières parties de chaque jour des suivantes", () => {
    expect(splitBySession(sessions(5, 5), PARIS)).toEqual({
      early: { games: 15, wins: 15 },
      late: { games: 10, wins: 0 },
    });
  });

  it("se tait tant qu'un côté a moins de dix parties", () => {
    expect(splitBySession(sessions(4, 5), PARIS)).toBeNull();
  });

  it("trie les parties avant de les ranger", () => {
    const shuffled = [...sessions(5, 5)].reverse();
    expect(splitBySession(shuffled, PARIS)?.late.games).toBe(10);
  });
});
