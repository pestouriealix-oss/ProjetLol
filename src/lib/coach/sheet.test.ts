import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Draft } from "@/lib/draft/draft";
import type { Matchup } from "@/lib/llm/prompts/draft-matchup";

/**
 * La fiche de draft, modèle et base remplacés : on vérifie que le duel passe
 * par le contrôle avant d'être montré et gardé.
 */

type ToolCallLike = { tool: { name: string }; content: string; model: string };

const calls: ToolCallLike[] = [];
let duels: Matchup[] = [];
const partials: unknown[] = [];

const saveMatchupNote = vi.fn(async () => undefined);

vi.mock("@/lib/llm", () => ({
  MODELS: { draftSheet: "haiku", matchup: "sonnet" },
  llm: {
    streamTool: vi.fn(async (call: ToolCallLike) => {
      calls.push(call);
      if (call.tool.name === "ecrire_duel") return duels.shift();
      return { ours: "Jouer la fin de partie.", theirs: "Finir vite." };
    }),
  },
}));
vi.mock("@/lib/ddragon/champions", () => ({
  getChampionAssets: async () => ({
    version: "16.22.1",
    list: () => [
      { id: "Orianna", name: "Orianna", iconUrl: "" },
      { id: "Katarina", name: "Katarina", iconUrl: "" },
      { id: "Zed", name: "Zed", iconUrl: "" },
    ],
    name: (id: string) => id,
    keyOf: () => 1,
  }),
}));
vi.mock("@/lib/db/draft-analyses", () => ({
  countDraftAnalysesSince: async () => 0,
  createDraftAnalysis: async () => "fiche-1",
}));
vi.mock("@/lib/db/matchup-notes", () => ({
  findMatchupNote: async () => null,
  saveMatchupNote,
}));
vi.mock("@/lib/db/ranks", () => ({ listLatestRanks: async () => [] }));
vi.mock("@/lib/db/riot-accounts", () => ({ listRiotAccounts: async () => [] }));
vi.mock("./usage", () => ({ trackUsage: () => undefined }));
vi.mock("./facts", () => ({
  loadMatchupFacts: async () => ({
    facts: { patch: "16.22", ddragonVersion: "16.22.1", stats: null },
    mine: {
      id: "Orianna",
      name: "Orianna",
      title: "",
      tags: [],
      passive: { name: "Remontage", text: "Dégâts magiques en plus." },
      spells: [
        { key: "E", name: "Commande : Protection", cooldown: "9", text: "Protège.", maxRank: 5 },
        {
          key: "R",
          name: "Commande : Onde de choc",
          cooldown: "110/95/80",
          text: "Attire.",
          maxRank: 3,
        },
      ],
    },
    theirs: {
      id: "Katarina",
      name: "Katarina",
      title: "",
      tags: [],
      passive: { name: "Voracité", text: "Un kill réduit ses délais." },
      spells: [
        {
          key: "E",
          name: "Shunpo",
          cooldown: "14/12.5/11/9.5/8",
          text: "Se téléporte.",
          maxRank: 5,
        },
        { key: "R", name: "Lotus mortel", cooldown: "90/60/45", text: "Dagues.", maxRank: 3 },
      ],
    },
    roleRates: { mine: null, theirs: null },
  }),
}));

const { writeDraftSheet } = await import("./sheet");

const draft: Draft = {
  myRole: "MID",
  allies: { TOP: null, JUNGLE: null, MID: "Orianna", ADC: null, SUPPORT: null },
  enemies: { TOP: null, JUNGLE: null, MID: "Katarina", ADC: null, SUPPORT: null },
};

const duel = (watchOut: string): Matchup => ({
  verdict: "unfavorable",
  summary: "Katarina domine avant tes objets.",
  keyMoments: "Niveau 6 : son R et le tien changent les combats.",
  options: [
    { title: "Jouer à distance", detail: "Touche-la avec ton A." },
    { title: "Jouer le lead", detail: "Prends l'avantage au farm." },
  ],
  watchOut,
});
const wrong = duel("Garde ta sphère sur ton allié de voie face à Shunpo.");
const right = duel("Une fois ton E utilisé, son E te tombe dessus.");

const write = () => writeDraftSheet("user-1", draft, (partial) => partials.push(partial));

beforeEach(() => {
  calls.length = 0;
  partials.length = 0;
  saveMatchupNote.mockClear();
});

describe("le duel de la fiche", () => {
  it("est écrit par le modèle du duel, puis montré et gardé s'il passe le contrôle", async () => {
    duels = [right];
    const { sheet } = await write();
    expect(sheet.matchup?.watchOut).toBe(right.watchOut);
    expect(calls.find((call) => call.tool.name === "ecrire_duel")?.model).toBe("sonnet");
    expect(saveMatchupNote).toHaveBeenCalledWith(expect.objectContaining({ model: "sonnet" }));
  });

  it("est réécrit avec la liste des erreurs, et seul le texte juste est montré", async () => {
    duels = [wrong, right];
    const { sheet } = await write();

    const duelCalls = calls.filter((call) => call.tool.name === "ecrire_duel");
    expect(duelCalls).toHaveLength(2);
    expect(duelCalls[1]!.content).toContain("Un premier jet de ce duel contenait des erreurs");
    expect(duelCalls[1]!.content).toContain("« Shunpo » est le nom du E de Katarina");
    expect(sheet.matchup?.watchOut).toBe(right.watchOut);
    // Le premier jet n'a jamais été envoyé à la page.
    expect(JSON.stringify(partials)).not.toContain("Shunpo");
    expect(saveMatchupNote).toHaveBeenCalledTimes(1);
  });

  it("n'est ni montré ni gardé s'il échoue deux fois", async () => {
    duels = [wrong, wrong];
    const { sheet } = await write();
    expect(sheet.matchup).toBeNull();
    expect(sheet.winConditions.ours).toBe("Jouer la fin de partie.");
    expect(saveMatchupNote).not.toHaveBeenCalled();
    expect(JSON.stringify(partials)).not.toContain("Shunpo");
  });
});
