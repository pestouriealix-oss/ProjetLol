import { describe, expect, it } from "vitest";

import type { Role } from "@/lib/config";

import type { DetailPlayer, DetailTeam, MatchDetail } from "./match-detail";
import { buildReviewFacts, habitsWithout, reviewFactsSchema } from "./review";
import type { ReducedTimeline } from "./timeline";

function player(
  puuid: string,
  role: Role | null,
  overrides: Partial<DetailPlayer> = {},
): DetailPlayer {
  return {
    puuid,
    isMe: puuid === "moi",
    championName: puuid === "moi" ? "LeeSin" : "Ivern",
    role,
    riotId: null,
    level: 15,
    kills: 5,
    deaths: 3,
    assists: 10,
    kda: 5,
    killParticipation: 0.6,
    cs: 180,
    csPerMinute: 6,
    gold: 12_000,
    damage: 18_000,
    damageShare: 0.2,
    damageTaken: 20_000,
    vision: 30,
    wardsPlaced: 10,
    controlWards: 3,
    items: [],
    trinket: 0,
    spells: [4, 11],
    keystone: null,
    secondaryStyle: null,
    ...overrides,
  };
}

const objectives = {
  towers: 0,
  inhibitors: 0,
  dragons: 0,
  barons: 0,
  heralds: 0,
  grubs: 0,
  atakhan: 0,
};

function team(teamId: number, win: boolean, players: DetailPlayer[]): DetailTeam {
  return {
    teamId,
    side: teamId === 100 ? "BLUE" : "RED",
    isMine: teamId === 100,
    win,
    kills: 20,
    deaths: 15,
    assists: 40,
    gold: 60_000,
    damage: 90_000,
    objectives: { ...objectives, dragons: teamId === 100 ? 3 : 1 },
    players,
  };
}

const me = player("moi", "JUNGLE");
const opponent = player("lui", "JUNGLE", { cs: 150, csPerMinute: 5 });

const detail: MatchDetail = {
  id: "EUW1_1",
  queueId: 420,
  startedAt: new Date("2026-10-20T20:00:00Z"),
  durationSeconds: 1800,
  patch: "16.20",
  teams: [team(100, true, [me]), team(200, false, [opponent])],
  me,
  maxDamage: 18_000,
};

const minutes = Array.from({ length: 21 }, (_, minute) => minute);
const timeline: ReducedTimeline = {
  version: 2,
  gold: minutes.map((minute) => ({ minute, blue: 500 + minute * 1100, red: 500 + minute * 1000 })),
  players: {
    moi: {
      items: [],
      skills: [],
      frames: {
        gold: minutes.map((minute) => 500 + minute * 420),
        cs: minutes.map((minute) => minute * 6),
        xp: minutes.map((minute) => minute * 500),
      },
      deaths: [300, 840, 1500],
      takedowns: [],
    },
    lui: {
      items: [],
      skills: [],
      frames: {
        gold: minutes.map((minute) => 500 + minute * 400),
        cs: minutes.map((minute) => minute * 5),
        xp: minutes.map((minute) => minute * 480),
      },
      deaths: [],
      takedowns: [],
    },
  },
  objectives: [
    // Dragon pris par l'adversaire 40 s après la mort à 14:00.
    { seconds: 880, teamId: 200, type: "dragon", subType: "FIRE_DRAGON" },
    { seconds: 1200, teamId: 100, type: "baron", subType: null },
  ],
};

const totals = {
  games: 11,
  wins: 6,
  deaths: 3 + 40,
  cs: 180 + 10 * 165,
  damage: 18_000 + 10 * 16_000,
  vision: 30 + 10 * 25,
  killParticipation: (0.6 + 10 * 0.5) / 11,
  seconds: 1800 * 11,
};

describe("buildReviewFacts", () => {
  const facts = buildReviewFacts(detail, timeline, totals, true)!;

  it("compare le joueur à son vis-à-vis à 10 et 15 minutes", () => {
    expect(facts.lane).toEqual([
      { minute: 10, goldDiff: 200, csDiff: 10, xpDiff: 200 },
      { minute: 15, goldDiff: 300, csDiff: 15, xpDiff: 300 },
    ]);
  });

  it("repère les morts précoces et celles qui précèdent un objectif adverse", () => {
    expect(facts.deaths).toEqual({
      times: [300, 840, 1500],
      beforeMinute15: 2,
      beforeEnemyObjective: 1,
    });
  });

  it("suit l'écart d'or de l'équipe et ses extrêmes", () => {
    expect(facts.teamGold).toEqual({
      at10: 1000,
      at20: 2000,
      final: 2000,
      biggestLead: { minute: 20, gold: 2000 },
      biggestDeficit: { minute: 0, gold: 0 },
    });
  });

  it("retire la partie de ses habitudes", () => {
    expect(facts.habits).toMatchObject({ games: 10, winRate: 0.5, deathsPerGame: 4 });
    expect(facts.habits?.csPerMinute).toBeCloseTo(5.5);
    expect(facts.habits?.killParticipation).toBeCloseTo(0.5);
  });

  it("produit une forme que son schéma relit", () => {
    expect(reviewFactsSchema.parse(facts)).toEqual(facts);
  });

  it("se passe de la chronologie, et refuse une partie sans poste", () => {
    const bare = buildReviewFacts(detail, null, null, false)!;
    expect(bare.lane).toEqual([]);
    expect(bare.teamGold).toBeNull();
    expect(bare.habits).toBeNull();
    expect(
      buildReviewFacts({ ...detail, me: { ...me, role: null } }, timeline, null, false),
    ).toBeNull();
  });
});

describe("habitsWithout", () => {
  it("garde les totaux tels quels pour une partie qui n'y est pas comptée", () => {
    expect(habitsWithout(totals, { counted: false, win: true, me, seconds: 1800 })?.games).toBe(11);
    expect(
      habitsWithout({ ...totals, games: 1 }, { counted: true, win: true, me, seconds: 1800 }),
    ).toBeNull();
  });
});
