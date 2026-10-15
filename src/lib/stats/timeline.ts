import { z } from "zod";

import type { TimelineDto } from "@/lib/riot/schemas";

/**
 * Chronologie réduite d'une partie : ce que la page de détail affiche, sans
 * les ~1 Mo de la chronologie brute de Riot. C'est cette forme qui est
 * stockée ; elle est relue avec son schéma Zod.
 */

export const objectiveTypes = [
  "dragon",
  "elder",
  "baron",
  "herald",
  "grubs",
  "atakhan",
  "tower",
  "inhibitor",
] as const;
export type ObjectiveType = (typeof objectiveTypes)[number];

export const reducedTimelineSchema = z.object({
  version: z.literal(1),
  /** Or total de chaque équipe à chaque minute. */
  gold: z.array(z.object({ minute: z.number(), blue: z.number(), red: z.number() })),
  /** Achats et ordre des compétences, par joueur (clé : puuid). */
  players: z.record(
    z.string(),
    z.object({
      items: z.array(z.object({ seconds: z.number(), itemId: z.number().int() })),
      /** Compétence montée à chaque niveau : 1 = Q, 2 = W, 3 = E, 4 = R. */
      skills: z.array(z.number().int().min(1).max(4)),
    }),
  ),
  objectives: z.array(
    z.object({
      seconds: z.number(),
      /** Équipe qui a pris l'objectif. */
      teamId: z.number().int(),
      type: z.enum(objectiveTypes),
      /** Élément du dragon (« FIRE_DRAGON »…), quand il y en a un. */
      subType: z.string().nullable(),
    }),
  ),
});
export type ReducedTimeline = z.infer<typeof reducedTimelineSchema>;

const MONSTERS: Record<string, ObjectiveType> = {
  BARON_NASHOR: "baron",
  RIFTHERALD: "herald",
  HORDE: "grubs",
  ATAKHAN: "atakhan",
};

/**
 * Réduit la chronologie brute. `teamOf` donne l'équipe (100 ou 200) d'un
 * joueur d'après son puuid, lu dans la partie elle-même.
 */
export function reduceTimeline(
  timeline: TimelineDto,
  teamOf: (puuid: string) => number | undefined,
): ReducedTimeline {
  const { info } = timeline;
  const puuidOf = new Map(info.participants.map((p) => [p.participantId, p.puuid]));
  const teamOfParticipant = (id: number | undefined) => {
    const puuid = id === undefined ? undefined : puuidOf.get(id);
    return puuid ? teamOf(puuid) : undefined;
  };

  const gold = info.frames.map((frame) => {
    let blue = 0;
    let red = 0;
    for (const [id, participant] of Object.entries(frame.participantFrames)) {
      const team = teamOfParticipant(Number(id));
      if (team === 100) blue += participant.totalGold;
      else if (team === 200) red += participant.totalGold;
    }
    return { minute: Math.round(frame.timestamp / 60_000), blue, red };
  });

  const players: ReducedTimeline["players"] = {};
  for (const puuid of puuidOf.values()) players[puuid] = { items: [], skills: [] };

  const objectives: ReducedTimeline["objectives"] = [];
  for (const event of info.frames.flatMap((frame) => frame.events)) {
    const seconds = Math.round(event.timestamp / 1000);
    const puuid = event.participantId !== undefined ? puuidOf.get(event.participantId) : undefined;
    const player = puuid ? players[puuid] : undefined;

    switch (event.type) {
      case "ITEM_PURCHASED":
        if (player && event.itemId) player.items.push({ seconds, itemId: event.itemId });
        break;
      case "ITEM_UNDO": {
        // Un achat annulé disparaît de la liste (le dernier achat de cet objet).
        if (!player || !event.beforeId) break;
        const index = player.items.findLastIndex((item) => item.itemId === event.beforeId);
        if (index !== -1) player.items.splice(index, 1);
        break;
      }
      case "SKILL_LEVEL_UP":
        if (player && event.skillSlot && event.levelUpType !== "EVOLVE") {
          player.skills.push(event.skillSlot);
        }
        break;
      case "ELITE_MONSTER_KILL": {
        if (event.killerTeamId !== 100 && event.killerTeamId !== 200) break;
        const type =
          event.monsterType === "DRAGON"
            ? event.monsterSubType === "ELDER_DRAGON"
              ? "elder"
              : "dragon"
            : MONSTERS[event.monsterType ?? ""];
        if (!type) break;
        objectives.push({
          seconds,
          teamId: event.killerTeamId,
          type,
          subType: type === "dragon" ? (event.monsterSubType ?? null) : null,
        });
        break;
      }
      case "BUILDING_KILL": {
        // `teamId` est l'équipe qui a perdu le bâtiment.
        const type =
          event.buildingType === "TOWER_BUILDING"
            ? "tower"
            : event.buildingType === "INHIBITOR_BUILDING"
              ? "inhibitor"
              : null;
        if (!type || (event.teamId !== 100 && event.teamId !== 200)) break;
        objectives.push({ seconds, teamId: event.teamId === 100 ? 200 : 100, type, subType: null });
        break;
      }
    }
  }

  return { version: 1, gold, players, objectives };
}
