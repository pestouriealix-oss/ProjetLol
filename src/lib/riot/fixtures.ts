/**
 * Réponses de l'API Riot fabriquées pour les tests, à la forme de Match-V5 et
 * League-V4. Aucune donnée réelle.
 */

const POSITIONS = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;
const BLUE = ["Garen", "LeeSin", "Ahri", "Caitlyn", "Lux"];
const RED = ["Sett", "Ivern", "Orianna", "KogMaw", "Lulu"];

export type FixtureOptions = {
  matchId?: string;
  puuid?: string;
  /** Poste du joueur suivi (indice dans TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY). */
  position?: number;
  win?: boolean;
  queueId?: number;
  startedAt?: number;
  champion?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
};

export function matchFixture({
  matchId = "EUW1_7000000001",
  puuid = "puuid-joueur",
  position = 1,
  win = true,
  queueId = 420,
  startedAt = Date.UTC(2026, 9, 10, 18, 0, 0),
  champion,
  kills = 7,
  deaths = 2,
  assists = 9,
}: FixtureOptions = {}) {
  const participant = (teamId: 100 | 200, index: number) => {
    const tracked = teamId === 100 && index === position;
    const names = teamId === 100 ? BLUE : RED;
    return {
      puuid: tracked ? puuid : `puuid-${teamId}-${index}`,
      teamId,
      championId: teamId + index,
      championName: tracked && champion ? champion : names[index],
      teamPosition: POSITIONS[index],
      win: teamId === 100 ? win : !win,
      kills: tracked ? kills : 3,
      deaths: tracked ? deaths : 4,
      assists: tracked ? assists : 5,
      champLevel: 15,
      totalMinionsKilled: 30,
      neutralMinionsKilled: tracked ? 150 : 10,
      goldEarned: 11200,
      totalDamageDealtToChampions: 18400,
      visionScore: 24,
      item0: 6692,
      item1: 3111,
      item2: 0,
      item3: 3071,
      item4: 0,
      item5: 0,
      item6: 3364,
      riotIdGameName: tracked ? "Joueur" : `Joueur${teamId}${index}`,
      riotIdTagline: "EUW",
      totalDamageTaken: 21000,
      wardsPlaced: 9,
      detectorWardsPlaced: 2,
      visionWardsBoughtInGame: 3,
      summoner1Id: 4,
      summoner2Id: index === 1 ? 11 : 14,
      perks: {
        styles: [
          {
            description: "primaryStyle",
            style: 8100,
            selections: [{ perk: 8112 }, { perk: 8139 }],
          },
          { description: "subStyle", style: 8300, selections: [{ perk: 8304 }] },
        ],
      },
    };
  };
  return {
    metadata: { matchId, participants: [] },
    info: {
      gameCreation: startedAt - 60_000,
      gameStartTimestamp: startedAt,
      gameDuration: 1754,
      gameVersion: "16.20.712.4567",
      queueId,
      participants: [
        ...POSITIONS.map((_, index) => participant(100, index)),
        ...POSITIONS.map((_, index) => participant(200, index)),
      ],
      teams: [
        {
          teamId: 100,
          win,
          objectives: {
            champion: { kills: 19 },
            tower: { kills: win ? 9 : 3 },
            dragon: { kills: 3 },
            baron: { kills: win ? 1 : 0 },
          },
        },
        {
          teamId: 200,
          win: !win,
          objectives: {
            champion: { kills: 20 },
            tower: { kills: win ? 3 : 9 },
            dragon: { kills: 1 },
          },
        },
      ],
    },
  };
}

export const leagueEntriesFixture = [
  {
    queueType: "RANKED_SOLO_5x5",
    tier: "EMERALD",
    rank: "III",
    leaguePoints: 42,
    wins: 61,
    losses: 55,
    hotStreak: false,
  },
  {
    queueType: "RANKED_FLEX_SR",
    tier: "PLATINUM",
    rank: "I",
    leaguePoints: 75,
    wins: 12,
    losses: 9,
  },
];
