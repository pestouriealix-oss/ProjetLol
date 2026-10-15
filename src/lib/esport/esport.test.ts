import { describe, expect, it } from "vitest";

import { layoutBracket } from "./bracket";
import { groupBySerie, groupByDay, matchSides, pickFeatured, pickStage } from "./competitions";
import {
  bracketSchema,
  matchSchema,
  tournamentSchema,
  type BracketMatch,
  type Tournament,
} from "./schemas";
import { isSwissStage, swissGroups } from "./swiss";

const tournament = (id: number, overrides: Record<string, unknown> = {}): Tournament =>
  tournamentSchema.parse({
    id,
    name: `Étape ${id}`,
    begin_at: "2026-10-15T00:00:00Z",
    end_at: "2026-10-18T23:00:00Z",
    tier: "s",
    serie_id: 1,
    serie: { id: 1, full_name: "2026", year: 2026 },
    league: { id: 1, name: "Worlds" },
    ...overrides,
  });

const team = (id: number) => ({ id, name: `Équipe ${id}`, acronym: `T${id}`, image_url: null });

const bracketMatch = (
  id: number,
  previous: [number, "winner" | "loser"][] = [],
  extra: Record<string, unknown> = {},
): BracketMatch =>
  bracketSchema.parse([
    {
      id,
      status: "not_started",
      scheduled_at: `2026-10-${String(15 + Math.floor(id / 10)).padStart(2, "0")}T18:00:00Z`,
      previous_matches: previous.map(([match_id, type]) => ({ match_id, type })),
      ...extra,
    },
  ])[0]!;

describe("compétitions", () => {
  it("regroupe les étapes par compétition, dans l'ordre, avec un titre lisible", () => {
    const [worlds] = groupBySerie([
      tournament(3, {
        name: "Knockout",
        begin_at: "2026-11-03T00:00:00Z",
        end_at: "2026-11-14T23:00:00Z",
      }),
      tournament(1, { name: "Play-In" }),
      tournament(2, {
        name: "Swiss Stage",
        begin_at: "2026-10-23T00:00:00Z",
        end_at: "2026-10-31T23:00:00Z",
      }),
    ]);
    expect(worlds?.title).toBe("Worlds 2026");
    expect(worlds?.stages.map((stage) => stage.name)).toEqual([
      "Play-In",
      "Swiss Stage",
      "Knockout",
    ]);
    expect(worlds?.endAt?.toISOString()).toBe("2026-11-14T23:00:00.000Z");
  });

  it("met en avant la compétition la plus prestigieuse en cours", () => {
    const worlds = groupBySerie([tournament(1)]);
    const regional = groupBySerie([tournament(9, { tier: "a", serie_id: 2, serie: { id: 2 } })]);
    expect(pickFeatured([...regional, ...worlds], [])?.serieId).toBe(1);
    // Rien de majeur en cours : la prochaine compétition majeure passe devant une ligue régionale.
    expect(pickFeatured(regional, worlds)?.serieId).toBe(1);
    expect(pickFeatured([], [])).toBeNull();
  });

  it("choisit l'étape demandée, sinon celle en cours, sinon la prochaine, sinon la dernière", () => {
    const stages = [
      tournament(1, { begin_at: "2026-10-15T00:00:00Z", end_at: "2026-10-18T23:00:00Z" }),
      tournament(2, { begin_at: "2026-10-23T00:00:00Z", end_at: "2026-10-31T23:00:00Z" }),
    ];
    expect(pickStage(stages, new Date("2026-10-16T12:00:00Z"))?.id).toBe(1);
    expect(pickStage(stages, new Date("2026-10-20T12:00:00Z"))?.id).toBe(2);
    expect(pickStage(stages, new Date("2026-12-01T12:00:00Z"))?.id).toBe(2);
    expect(pickStage(stages, new Date("2026-10-16T12:00:00Z"), 2)?.id).toBe(2);
    expect(pickStage(stages, new Date("2026-10-16T12:00:00Z"), 99)?.id).toBe(1);
  });

  it("donne les deux équipes d'un match, même quand l'une n'est pas encore connue", () => {
    const match = matchSchema.parse({
      id: 1,
      status: "finished",
      opponents: [{ opponent: team(1) }, { opponent: team(2) }],
      results: [
        { team_id: 1, score: 3 },
        { team_id: 2, score: 1 },
      ],
      winner_id: 1,
    });
    expect(matchSides(match).map((side) => [side.team?.id, side.score, side.isWinner])).toEqual([
      [1, 3, true],
      [2, 1, false],
    ]);
    const tbd = matchSchema.parse({
      id: 2,
      status: "not_started",
      opponents: [{ opponent: team(1) }],
    });
    expect(matchSides(tbd)[1]).toEqual({ team: null, score: null, isWinner: false });
  });

  it("range les matchs par jour, à l'heure de Paris", () => {
    const at = (id: number, date: string | null) =>
      matchSchema.parse({ id, status: "not_started", scheduled_at: date });
    const days = groupByDay(
      [at(1, "2026-10-15T22:30:00Z"), at(2, "2026-10-15T15:00:00Z"), at(3, null)],
      "Europe/Paris",
    );
    // 22 h 30 UTC, c'est déjà le 16 à Paris.
    expect(days.map((day) => [day.day, day.matches.map((match) => match.id)])).toEqual([
      ["2026-10-15", [2]],
      ["2026-10-16", [1]],
      [null, [3]],
    ]);
  });
});

describe("arbre", () => {
  it("met en colonnes un arbre à élimination directe", () => {
    const sections = layoutBracket([
      bracketMatch(31, [
        [21, "winner"],
        [22, "winner"],
      ]),
      bracketMatch(11),
      bracketMatch(12),
      bracketMatch(13),
      bracketMatch(14),
      bracketMatch(21, [
        [11, "winner"],
        [12, "winner"],
      ]),
      bracketMatch(22, [
        [13, "winner"],
        [14, "winner"],
      ]),
    ]);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.kind).toBe("single");
    expect(sections[0]?.columns.map((column) => column.map((match) => match.id))).toEqual([
      [11, 12, 13, 14],
      [21, 22],
      [31],
    ]);
  });

  it("sépare gagnants, perdants et grande finale dans une double élimination (Play-In à quatre)", () => {
    const sections = layoutBracket([
      bracketMatch(11),
      bracketMatch(12),
      bracketMatch(21, [
        [11, "winner"],
        [12, "winner"],
      ]),
      bracketMatch(22, [
        [11, "loser"],
        [12, "loser"],
      ]),
      bracketMatch(31, [
        [21, "loser"],
        [22, "winner"],
      ]),
      bracketMatch(41, [
        [21, "winner"],
        [31, "winner"],
      ]),
    ]);
    const shape = Object.fromEntries(
      sections.map((section) => [
        section.kind,
        section.columns.map((column) => column.map((m) => m.id)),
      ]),
    );
    expect(shape).toEqual({ upper: [[11, 12], [21]], lower: [[22], [31]], final: [[41]] });
  });
});

describe("phase suisse", () => {
  it("reconnaît la phase et regroupe le classement par bilan", () => {
    expect(isSwissStage("Swiss Stage")).toBe(true);
    expect(isSwissStage("Play-In")).toBe(false);
    const standing = (rank: number, id: number, wins: number, losses: number) => ({
      rank,
      team: team(id),
      wins,
      losses,
    });
    const groups = swissGroups([
      standing(5, 5, 1, 1),
      standing(1, 1, 3, 0),
      standing(9, 9, 0, 3),
      standing(3, 3, 2, 1),
      standing(4, 4, 2, 1),
      standing(6, 6, 1, 2),
    ]);
    expect(
      groups.map((group) => [
        group.kind,
        `${group.wins}-${group.losses}`,
        group.standings.map((s) => s.team.id),
      ]),
    ).toEqual([
      ["qualified", "3-0", [1]],
      ["active", "2-1", [3, 4]],
      ["active", "1-1", [5]],
      ["active", "1-2", [6]],
      ["eliminated", "0-3", [9]],
    ]);
  });
});
