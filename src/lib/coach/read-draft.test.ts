import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/llm", () => ({ llm: {}, MODELS: {} }));
vi.mock("@/lib/ddragon/champions", () => ({ getChampionAssets: async () => null }));

const { toDraft } = await import("./read-draft");

const match = (name: string) =>
  ({ "lee sin": "LeeSin", garen: "Garen", ahri: "Ahri", sett: "Sett", ivern: "Ivern" })[
    name.toLowerCase()
  ] ?? null;

describe("toDraft", () => {
  it("range les champions par rôle et retrouve le rôle du joueur mis en avant", () => {
    const { draft, unrecognized } = toDraft(
      {
        screen: "champ_select",
        allies: [
          { champion: "Garen", role: "TOP" },
          { champion: "Lee Sin", role: "JUNGLE" },
          { champion: "Ahri", role: "MID" },
          { champion: "", role: "ADC" },
          { champion: "Inconnu", role: "SUPPORT" },
        ],
        enemies: [
          { champion: "Sett", role: "UNKNOWN" },
          { champion: "Ivern", role: "UNKNOWN" },
        ],
        playerSlot: 1,
      },
      match,
      "MID",
    );
    expect(draft.myRole).toBe("JUNGLE");
    expect(draft.allies).toEqual({
      TOP: "Garen",
      JUNGLE: "LeeSin",
      MID: "Ahri",
      ADC: null,
      SUPPORT: null,
    });
    expect(draft.enemies.TOP).toBe("Sett");
    expect(draft.enemies.JUNGLE).toBe("Ivern");
    expect(unrecognized).toBe(1);
  });

  it("garde le rôle par défaut quand le joueur n'est pas repérable", () => {
    const { draft } = toDraft(
      {
        screen: "loading",
        allies: [{ champion: "Ahri", role: "UNKNOWN" }],
        enemies: [],
        playerSlot: -1,
      },
      match,
      "SUPPORT",
    );
    expect(draft.myRole).toBe("SUPPORT");
    expect(draft.allies.TOP).toBe("Ahri");
  });
});
