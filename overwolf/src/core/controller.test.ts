import { describe, expect, it, vi } from "vitest";

import type { Draft } from "@/lib/draft/draft";

import { ApiError, type GufoApi, type LiveResult, type Me, type SheetEvent } from "./api";
import { Controller, SHEET_IN_GAME_MS, type Platform, type PlatformSignals } from "./controller";

const me: Me = {
  name: "Alix",
  plan: "FREE",
  founder: true,
  trialEndsAt: null,
  coachReady: true,
  sheets: { limit: 3, remaining: 3 },
  accounts: [{ gameName: "Alix", tagLine: "EUW", platform: "EUW1", primary: true, owned: true }],
};

const draft: Draft = {
  myRole: "MID",
  allies: { TOP: null, JUNGLE: null, MID: "Ahri", ADC: null, SUPPORT: null },
  enemies: { TOP: null, JUNGLE: null, MID: "Zed", ADC: null, SUPPORT: null },
};

function setup(
  options: {
    token?: string;
    live?: LiveResult[];
    sheet?: SheetEvent[];
    meError?: ApiError;
    /** Remplace l'attente instantanée pour un délai donné ; `undefined` garde l'instantané. */
    sleep?: (ms: number) => Promise<void> | undefined;
  } = {},
) {
  const store = new Map<string, string>(options.token ? [["gufo.token", options.token]] : []);
  let signals: PlatformSignals | undefined;
  const platform: Platform = {
    start: (s) => {
      signals = s;
    },
    showWindow: vi.fn(),
    hideWindow: vi.fn(),
    openUrl: vi.fn(),
    hotkeyBinding: async () => "Ctrl+Shift+G",
    storage: {
      get: (key) => store.get(key) ?? null,
      set: (key, value) => void store.set(key, value),
      remove: (key) => void store.delete(key),
    },
  };
  const lives = [...(options.live ?? [])];
  const api = {
    siteUrl: (path: string) => `https://gufo.test${path}`,
    me: vi.fn(async () => {
      if (options.meError) throw options.meError;
      return me;
    }),
    champions: vi.fn(async () => [{ key: 103, id: "Ahri", name: "Ahri", iconUrl: "a.png" }]),
    startLink: vi.fn(async () => ({
      deviceCode: "d",
      userCode: "K7QM-2XPA",
      expiresIn: 600,
      interval: 3,
    })),
    pollToken: vi
      .fn()
      .mockResolvedValueOnce({ status: "pending" })
      .mockResolvedValueOnce({ status: "approved", token: "jeton" }),
    logout: vi.fn(async () => undefined),
    live: vi.fn(async () => lives.shift() ?? { status: "not_in_game" }),
    async *sheet() {
      for (const event of options.sheet ?? []) yield event;
    },
  };
  let clock = 0;
  const controller = new Controller(platform, () => api as unknown as GufoApi, {
    sleep: async (ms) => {
      const custom = options.sleep?.(ms);
      if (custom) return custom;
      clock += ms;
    },
    now: () => clock,
  });
  controller.start();
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  return { controller, platform, api, store, signals: () => signals!, flush, clock: () => clock };
}

describe("liaison avec le compte", () => {
  it("ouvre la page du code, attend la validation, puis garde le jeton", async () => {
    const { controller, platform, store } = setup();
    expect(controller.getState().account.status).toBe("signed_out");

    await controller.startLink();

    expect(platform.openUrl).toHaveBeenCalledWith("https://gufo.test/app?code=K7QM2XPA");
    expect(store.get("gufo.token")).toBe("jeton");
    expect(controller.getState().account).toEqual({ status: "signed_in", me });
    expect(controller.getState().link).toEqual({ status: "idle" });
  });

  it("oublie un jeton révoqué", async () => {
    const { controller, store, flush } = setup({
      token: "vieux",
      meError: new ApiError("unauthorized"),
    });
    await flush();
    expect(controller.getState().account.status).toBe("signed_out");
    expect(store.has("gufo.token")).toBe(false);
  });
});

describe("la fiche à l'écran de chargement", () => {
  it("cherche la partie, écrit la fiche, et la garde 45 secondes de jeu", async () => {
    const sheet = { winConditions: { ours: "Jouer autour du dragon", theirs: "Diviser" } };
    const { controller, platform, signals, flush, clock } = setup({
      token: "jeton",
      live: [{ status: "not_in_game" }, { status: "found", draft, riotId: "Alix" }],
      sheet: [
        { type: "partial", sheet },
        { type: "done", id: "fiche-1", sheet },
      ],
    });
    await flush();

    signals().launcherPhase("ChampSelect");
    expect(controller.getState().stage).toBe("champ_select");
    signals().launcherPhase("InProgress");
    signals().gameRunning(true);
    expect(controller.getState().stage).toBe("loading");
    expect(platform.showWindow).toHaveBeenCalledWith("in_game");
    for (let i = 0; i < 5; i += 1) await flush();
    expect(controller.getState().sheet).toMatchObject({ status: "ready", id: "fiche-1" });

    vi.mocked(platform.hideWindow).mockClear();
    signals().matchStarted();
    expect(controller.getState().stage).toBe("in_game");
    // Toujours là au début de la partie…
    expect(controller.getState().sheetVisible).toBe(true);
    expect(platform.hideWindow).not.toHaveBeenCalled();
    // … puis rangée une fois le délai passé.
    await flush();
    expect(clock()).toBeGreaterThanOrEqual(SHEET_IN_GAME_MS);
    expect(controller.getState().sheetVisible).toBe(false);
    expect(platform.hideWindow).toHaveBeenCalledWith("in_game");

    // Le raccourci la rouvre pendant la partie, sans la réécrire.
    signals().hotkey();
    expect(controller.getState().sheetVisible).toBe(true);
    expect(controller.getState().sheet).toMatchObject({ status: "ready", id: "fiche-1" });
    signals().hotkey();
    expect(controller.getState().sheetVisible).toBe(false);

    // Fin de partie : elle ne se rouvre plus.
    signals().gameRunning(false);
    signals().launcherPhase("EndOfGame");
    signals().hotkey();
    expect(controller.getState().sheetVisible).toBe(false);
  });

  it("ne range pas une fiche que le joueur a rouverte entre-temps", async () => {
    let release: () => void = () => undefined;
    const { controller, signals, flush } = setup({
      token: "jeton",
      live: [{ status: "found", draft, riotId: "Alix" }],
      sheet: [{ type: "done", id: "fiche-2", sheet: {} }],
      // Le délai de 45 s ne s'écoule que sur commande.
      sleep: (ms) =>
        ms === SHEET_IN_GAME_MS ? new Promise<void>((resolve) => (release = resolve)) : undefined,
    });
    await flush();
    signals().gameRunning(true);
    for (let i = 0; i < 5; i += 1) await flush();
    signals().matchStarted();
    // Le joueur la range puis la rouvre avant la fin du délai : elle reste.
    signals().hotkey();
    signals().hotkey();
    release();
    await flush();
    expect(controller.getState().sheetVisible).toBe(true);
  });

  it("écrit la fiche à la demande si le compte n'était pas prêt au chargement", async () => {
    const { controller, api, signals, flush } = setup({
      token: "jeton",
      live: [{ status: "found", draft, riotId: "Alix" }],
      sheet: [{ type: "done", id: "fiche-3", sheet: {} }],
    });
    // Lancée avec le jeu : la partie démarre avant que le compte soit relu.
    signals().gameRunning(true);
    signals().matchStarted();
    await flush();
    expect(controller.getState().account.status).toBe("signed_in");
    expect(controller.getState().sheetVisible).toBe(false);
    expect(api.live).not.toHaveBeenCalled();

    signals().hotkey();
    for (let i = 0; i < 5; i += 1) await flush();
    expect(controller.getState().sheetVisible).toBe(true);
    expect(controller.getState().sheet).toMatchObject({ status: "ready", id: "fiche-3" });
  });

  it("dit pourquoi il n'y a pas de fiche", async () => {
    const { controller, signals, flush } = setup({
      token: "jeton",
      live: [{ status: "not_owned" }],
    });
    await flush();
    signals().gameRunning(true);
    for (let i = 0; i < 3; i += 1) await flush();
    expect(controller.getState().sheet).toEqual({ status: "error", reason: "not_owned" });
  });

  it("traduit le quota épuisé", async () => {
    const { controller, signals, flush } = setup({
      token: "jeton",
      live: [{ status: "found", draft, riotId: "Alix" }],
      sheet: [{ type: "error", error: "quota" }],
    });
    await flush();
    signals().gameRunning(true);
    for (let i = 0; i < 4; i += 1) await flush();
    expect(controller.getState().sheet).toEqual({
      status: "error",
      reason: "quota",
      code: "quota",
    });
  });

  it("distingue une clé du modèle refusée d'une panne", async () => {
    const { controller, signals, flush } = setup({
      token: "jeton",
      live: [{ status: "found", draft, riotId: "Alix" }],
      sheet: [{ type: "error", error: "invalid_key" }],
    });
    await flush();
    signals().gameRunning(true);
    for (let i = 0; i < 4; i += 1) await flush();
    expect(controller.getState().sheet).toEqual({
      status: "error",
      reason: "coach_setup",
      code: "invalid_key",
    });
  });
});
