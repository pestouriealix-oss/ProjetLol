/**
 * Tests d'intégration sur une vraie base : les compteurs de matchups. Ignorés
 * sans DATABASE_URL. Un patch inventé par test évite de toucher aux vraies
 * statistiques.
 */
import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import type { MatchSample } from "@/lib/stats/matchups";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("statistiques de matchups", () => {
  it("compte une partie une seule fois, des deux côtés du duel", async () => {
    const api = await import("./matchup-stats");
    const patch = `0.${Math.floor(Math.random() * 1e6)}`;
    const sample: MatchSample = {
      patch,
      roles: [
        { role: "JUNGLE", champion: 64, win: true },
        { role: "JUNGLE", champion: 427, win: false },
      ],
      matchups: [
        { role: "JUNGLE", champion: 64, opponent: 427, win: true },
        { role: "JUNGLE", champion: 427, opponent: 64, win: false },
      ],
    };
    const first = `TEST_${randomUUID()}`;
    const second = `TEST_${randomUUID()}`;

    expect(await api.recordStatMatch(first, "EUW1", sample)).toBe(true);
    expect(await api.recordStatMatch(first, "EUW1", sample)).toBe(false);
    expect(await api.recordStatMatch(second, "EUW1", sample)).toBe(true);

    expect(await api.findMatchupStat(patch, "JUNGLE", 64, 427)).toEqual({ games: 2, wins: 2 });
    expect(await api.findMatchupStat(patch, "JUNGLE", 427, 64)).toEqual({ games: 2, wins: 0 });
    expect(await api.knownStatMatches([first, "INCONNUE"])).toEqual(new Set([first]));
    expect(await api.listChampionRoleStats(patch, [64])).toEqual([
      { role: "JUNGLE", champion: 64, games: 2, wins: 2 },
    ]);
  });

  it("garde un duel écrit une seule fois et le ressert", async () => {
    const notes = await import("./matchup-notes");
    const key = `test|${randomUUID()}`;
    expect(await notes.findMatchupNote(key)).toBeNull();
    const note = { key, patch: "0.0", model: "m", promptVersion: "p" };
    await notes.saveMatchupNote({ ...note, content: { summary: "premier" } });
    await notes.saveMatchupNote({ ...note, content: { summary: "second" } });
    expect(await notes.findMatchupNote(key)).toEqual({ summary: "premier" });
  });
});
