import { describe, expect, it } from "vitest";

import { matchFixture } from "@/lib/riot/fixtures";

import { buildMatchDetail } from "./match-detail";

describe("buildMatchDetail", () => {
  it("met l'équipe du joueur en premier, chaque équipe rangée par poste", () => {
    // Le joueur suivi est dans l'équipe rouge : elle doit quand même passer devant.
    const match = matchFixture({ puuid: "moi" });
    for (const participant of match.info.participants) {
      participant.teamId = participant.teamId === 100 ? 200 : 100;
    }
    const detail = buildMatchDetail(match, "moi");
    if (!detail) throw new Error("détail illisible");

    const [ours, theirs] = detail.teams;
    expect(ours).toMatchObject({ teamId: 200, side: "RED", isMine: true });
    expect(theirs).toMatchObject({ teamId: 100, side: "BLUE", isMine: false });
    expect(ours.players.map((p) => p.role)).toEqual(["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]);
    expect(ours.players.filter((p) => p.isMe)).toHaveLength(1);
  });

  it("calcule les parts d'équipe, le CS par minute et garde objets, sorts et runes", () => {
    const detail = buildMatchDetail(matchFixture({ puuid: "moi", kills: 7, assists: 9 }), "moi");
    if (!detail) throw new Error("détail illisible");
    const { me, teams } = detail;

    // 7 + 9 participations sur 7 + 4 × 3 éliminations d'équipe.
    expect(me.killParticipation).toBeCloseTo(16 / 19);
    // Pinks : posées (detectorWardsPlaced) et achetées (visionWardsBoughtInGame).
    expect(me).toMatchObject({ controlWards: 2, controlWardsBought: 3 });
    expect(me.damageShare).toBeCloseTo(1 / 5);
    expect(me.csPerMinute).toBeCloseTo(180 / (1754 / 60));
    expect(me.items).toEqual([6692, 3111, 0, 3071, 0, 0]);
    expect(me.trinket).toBe(3364);
    expect(me.spells).toEqual([4, 11]);
    expect(me.keystone).toBe(8112);
    expect(me.secondaryStyle).toBe(8300);
    expect(me.riotId).toEqual({ gameName: "Joueur", tagLine: "EUW" });
    expect(teams[0].objectives).toMatchObject({ towers: 9, dragons: 3, barons: 1, heralds: 0 });
    expect(detail.maxDamage).toBe(18400);
  });

  it("supporte une partie sans runes, sans objectifs ni Riot ID", () => {
    const match = matchFixture({ puuid: "moi" });
    const bare = {
      ...match,
      info: {
        ...match.info,
        teams: undefined,
        participants: match.info.participants.map((participant) => {
          const copy: Partial<typeof participant> = { ...participant };
          delete copy.perks;
          delete copy.riotIdGameName;
          return copy;
        }),
      },
    };
    const detail = buildMatchDetail(bare, "moi");
    expect(detail?.me).toMatchObject({ keystone: null, secondaryStyle: null, riotId: null });
    expect(detail?.teams[0].objectives.towers).toBe(0);
  });

  it("renvoie null pour une partie illisible ou sans ce joueur", () => {
    expect(buildMatchDetail({ pas: "une partie" }, "moi")).toBeNull();
    expect(buildMatchDetail(matchFixture({ puuid: "moi" }), "quelqu'un d'autre")).toBeNull();
  });
});
