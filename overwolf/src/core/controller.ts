import type { Draft } from "@/lib/draft/draft";
import type { SheetView } from "@/lib/draft/sheet-view";

import { ApiError, type Champion, type GufoApi, type Me } from "./api";
import { readChampSelect, type ChampSelect } from "./champ-select";
import { WINDOWS, type WindowName } from "./ids";
import { stageFrom, type Stage } from "./stage";

/**
 * Le cerveau de l'app, logé dans la fenêtre cachée : il suit le client de
 * League of Legends, relie l'app au compte, va chercher la fiche à l'écran de
 * chargement et décide quelle fenêtre se montre. Les fenêtres visibles ne
 * font qu'afficher son état et lui transmettre les clics.
 */

/** Ce que la plateforme (Overwolf, ou le banc d'essai) signale au contrôleur. */
export type PlatformSignals = {
  /** L'étape du lanceur (`game_flow.phase`) ; `null` quand il se ferme. */
  launcherPhase: (phase: string | null) => void;
  /** La sélection brute du lanceur (`champ_select.raw`). */
  champSelect: (raw: unknown) => void;
  gameRunning: (running: boolean) => void;
  /** L'horloge de la partie tourne : l'écran de chargement est passé. */
  matchStarted: () => void;
  /** Le raccourci « afficher ou masquer la fiche ». */
  hotkey: () => void;
  /** Le joueur a ouvert l'app lui-même (pas un lancement automatique avec le jeu). */
  openedByUser: () => void;
};

export type Platform = {
  start: (signals: PlatformSignals) => void;
  showWindow: (name: WindowName) => void;
  hideWindow: (name: WindowName) => void;
  openUrl: (url: string) => void;
  /** La touche choisie pour le raccourci de la fiche (« Ctrl+Shift+G »). */
  hotkeyBinding: () => Promise<string | null>;
  storage: {
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
    remove: (key: string) => void;
  };
};

export type AccountState =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "signed_in"; me: Me }
  /** Gufo ne répond pas : on garde le jeton et on réessaiera. */
  | { status: "offline" };

export type LinkState =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "waiting"; userCode: string; expiresAt: number }
  | { status: "expired" }
  | { status: "error"; reason: "network" | "rate_limited" | "server" };

export type SheetErrorReason =
  /** Riot ne montre pas de partie en cours pour les comptes du joueur. */
  | "not_found"
  | "no_account"
  | "not_owned"
  | "email_unverified"
  | "quota"
  | "budget"
  | "unavailable";

export type SheetState =
  | { status: "idle" }
  | { status: "looking" }
  | { status: "writing"; draft: Draft; sheet: SheetView }
  | { status: "ready"; draft: Draft; sheet: SheetView; id: string }
  | { status: "error"; reason: SheetErrorReason };

export type AppState = {
  account: AccountState;
  link: LinkState;
  stage: Stage;
  champSelect: ChampSelect | null;
  sheet: SheetState;
  /** Champions du patch, par numéro : noms et portraits. */
  champions: Record<number, Champion> | null;
  /** Montrer la fiche toute seule à l'écran de chargement. */
  autoShow: boolean;
  /** La fenêtre de la fiche est affichée. */
  sheetVisible: boolean;
  hotkey: string | null;
};

const TOKEN_KEY = "gufo.token";
const AUTO_SHOW_KEY = "gufo.autoShow";
/** Riot met quelques secondes à montrer la partie : on redemande pendant deux minutes. */
const LIVE_RETRY_MS = 5000;
const LIVE_ATTEMPTS = 24;

const SERVER_ERRORS: Record<string, SheetErrorReason> = {
  quota: "quota",
  budget: "budget",
  email_unverified: "email_unverified",
};

type Options = {
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

export class Controller {
  private state: AppState;
  private listeners = new Set<(state: AppState) => void>();
  private inputs = {
    launcherPhase: null as string | null,
    gameRunning: false,
    matchStarted: false,
  };
  /** Chaque recherche de fiche porte un numéro : une recherche dépassée s'arrête. */
  private sheetRun = 0;
  private linkRun = 0;
  private sheetAbort: AbortController | null = null;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => number;

  constructor(
    private readonly platform: Platform,
    private readonly makeApi: (getToken: () => string | null) => GufoApi,
    options: Options = {},
  ) {
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.now = options.now ?? (() => Date.now());
    this.api = makeApi(() => this.platform.storage.get(TOKEN_KEY));
    this.state = {
      account: this.platform.storage.get(TOKEN_KEY)
        ? { status: "loading" }
        : { status: "signed_out" },
      link: { status: "idle" },
      stage: "offline",
      champSelect: null,
      sheet: { status: "idle" },
      champions: null,
      autoShow: this.platform.storage.get(AUTO_SHOW_KEY) !== "false",
      sheetVisible: false,
      hotkey: null,
    };
  }

  readonly api: GufoApi;

  getState(): AppState {
    return this.state;
  }

  /**
   * Les fenêtres s'abonnent à l'état. Une fenêtre fermée laisse un abonné qui
   * ne répond plus : il est retiré à la première erreur.
   */
  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private set(patch: Partial<AppState>) {
    this.state = { ...this.state, ...patch };
    for (const listener of [...this.listeners]) {
      try {
        listener(this.state);
      } catch {
        this.listeners.delete(listener);
      }
    }
  }

  start() {
    this.platform.start({
      launcherPhase: (phase) => {
        this.inputs.launcherPhase = phase;
        if (phase !== "ChampSelect" && this.state.champSelect) this.set({ champSelect: null });
        this.updateStage();
      },
      champSelect: (raw) => {
        const champSelect = readChampSelect(raw);
        if (champSelect) this.set({ champSelect });
      },
      gameRunning: (running) => {
        this.inputs.gameRunning = running;
        if (!running) this.inputs.matchStarted = false;
        this.updateStage();
      },
      matchStarted: () => {
        if (this.inputs.matchStarted || !this.inputs.gameRunning) return;
        this.inputs.matchStarted = true;
        this.updateStage();
      },
      hotkey: () => this.toggleSheet(),
      openedByUser: () => this.platform.showWindow(WINDOWS.desktop),
    });
    void this.platform.hotkeyBinding().then((hotkey) => this.set({ hotkey }));
    if (this.state.account.status === "loading") void this.refreshAccount();
  }

  // ── Compte ────────────────────────────────────────────────────────────────

  async refreshAccount(): Promise<void> {
    if (!this.platform.storage.get(TOKEN_KEY)) {
      this.set({ account: { status: "signed_out" } });
      return;
    }
    try {
      const me = await this.api.me();
      this.set({ account: { status: "signed_in", me } });
      if (!this.state.champions) void this.loadChampions();
    } catch (error) {
      this.handleApiError(error);
    }
  }

  private async loadChampions() {
    try {
      const list = await this.api.champions();
      this.set({ champions: Object.fromEntries(list.map((champion) => [champion.key, champion])) });
    } catch {
      // Sans les noms, l'app affiche quand même la fiche : on réessaiera au prochain compte relu.
    }
  }

  private handleApiError(error: unknown) {
    if (error instanceof ApiError && error.kind === "unauthorized") {
      // Accès coupé depuis le site, ou mot de passe changé : il faut se relier.
      this.platform.storage.remove(TOKEN_KEY);
      this.set({ account: { status: "signed_out" } });
      return;
    }
    if (this.state.account.status !== "signed_in") this.set({ account: { status: "offline" } });
  }

  /** Commence la liaison : un code à valider sur le site, ouvert dans le navigateur. */
  async startLink(): Promise<void> {
    const run = ++this.linkRun;
    this.set({ link: { status: "starting" } });
    let start;
    try {
      start = await this.api.startLink();
    } catch (error) {
      const reason =
        error instanceof ApiError && error.kind === "rate_limited" ? "rate_limited" : "network";
      this.set({ link: { status: "error", reason } });
      return;
    }
    if (run !== this.linkRun) return;
    const expiresAt = this.now() + start.expiresIn * 1000;
    this.set({ link: { status: "waiting", userCode: start.userCode, expiresAt } });
    this.openLinkPage();

    while (run === this.linkRun && this.now() < expiresAt) {
      await this.sleep(start.interval * 1000);
      if (run !== this.linkRun) return;
      try {
        const result = await this.api.pollToken(start.deviceCode);
        if (result.status === "approved") {
          this.platform.storage.set(TOKEN_KEY, result.token);
          this.set({ link: { status: "idle" }, account: { status: "loading" } });
          await this.refreshAccount();
          return;
        }
        if (result.status === "expired") break;
      } catch {
        // Une coupure réseau ne casse pas la liaison : on redemande au tour suivant.
      }
    }
    if (run === this.linkRun) this.set({ link: { status: "expired" } });
  }

  /** Rouvre la page de validation du code en cours. */
  openLinkPage() {
    const link = this.state.link;
    if (link.status !== "waiting") return;
    const code = link.userCode.replace(/[^A-Z0-9]/gi, "");
    this.platform.openUrl(this.api.siteUrl(`/app?code=${code}`));
  }

  cancelLink() {
    this.linkRun += 1;
    this.set({ link: { status: "idle" } });
  }

  async logout(): Promise<void> {
    await this.api.logout();
    this.platform.storage.remove(TOKEN_KEY);
    this.set({ account: { status: "signed_out" }, sheet: { status: "idle" } });
  }

  // ── Réglages et fenêtres ──────────────────────────────────────────────────

  setAutoShow(autoShow: boolean) {
    this.platform.storage.set(AUTO_SHOW_KEY, String(autoShow));
    this.set({ autoShow });
  }

  openSite(path: string) {
    this.platform.openUrl(this.api.siteUrl(path));
  }

  /** La fiche ne s'affiche qu'à l'écran de chargement, jamais pendant la partie. */
  showSheet() {
    if (this.state.stage !== "loading") return;
    this.platform.showWindow(WINDOWS.inGame);
    this.set({ sheetVisible: true });
  }

  hideSheet() {
    this.platform.hideWindow(WINDOWS.inGame);
    if (this.state.sheetVisible) this.set({ sheetVisible: false });
  }

  toggleSheet() {
    if (this.state.sheetVisible) this.hideSheet();
    else this.showSheet();
  }

  // ── Étapes et fiche ───────────────────────────────────────────────────────

  private updateStage() {
    const previous = this.state.stage;
    const stage = stageFrom(this.inputs);
    if (stage === previous) return;
    this.set({ stage });

    if (stage === "loading") {
      void this.runSheet();
      if (this.state.autoShow && this.state.account.status === "signed_in") this.showSheet();
    } else {
      // La fiche s'efface dès que la partie commence (ou que le chargement est abandonné).
      this.hideSheet();
    }
    if (stage === "champ_select") {
      this.cancelSheet();
      this.set({ sheet: { status: "idle" } });
    }
    if (stage === "after_game") void this.refreshAccount();
  }

  private cancelSheet() {
    this.sheetRun += 1;
    this.sheetAbort?.abort();
    this.sheetAbort = null;
  }

  /** Relance la recherche de la fiche (bouton « Réessayer »). */
  retrySheet() {
    if (this.state.stage === "loading") void this.runSheet();
  }

  private async runSheet(): Promise<void> {
    if (this.state.account.status !== "signed_in") return;
    this.cancelSheet();
    const run = this.sheetRun;
    const current = () => run === this.sheetRun;
    this.set({ sheet: { status: "looking" } });

    let draft: Draft | null = null;
    for (let attempt = 0; attempt < LIVE_ATTEMPTS && current(); attempt += 1) {
      try {
        const live = await this.api.live();
        if (!current()) return;
        if (live.status === "found") {
          draft = live.draft;
          break;
        }
        if (live.status === "no_account" || live.status === "not_owned") {
          this.set({ sheet: { status: "error", reason: live.status } });
          return;
        }
      } catch (error) {
        if (error instanceof ApiError && error.kind === "unauthorized") {
          this.handleApiError(error);
          return;
        }
      }
      await this.sleep(LIVE_RETRY_MS);
    }
    if (!current()) return;
    if (!draft) {
      this.set({ sheet: { status: "error", reason: "not_found" } });
      return;
    }

    const abort = new AbortController();
    this.sheetAbort = abort;
    let sheet: SheetView = {};
    this.set({ sheet: { status: "writing", draft, sheet } });
    try {
      for await (const event of this.api.sheet(draft, abort.signal)) {
        if (!current()) return;
        if (event.type === "facts") sheet = { ...sheet, facts: event.facts };
        else if (event.type === "partial") sheet = { ...event.sheet, facts: sheet.facts };
        else if (event.type === "done") {
          this.set({ sheet: { status: "ready", draft, sheet: event.sheet, id: event.id } });
          void this.refreshAccount();
          return;
        } else {
          this.set({
            sheet: { status: "error", reason: SERVER_ERRORS[event.error] ?? "unavailable" },
          });
          return;
        }
        this.set({ sheet: { status: "writing", draft, sheet } });
      }
    } catch (error) {
      if (!current()) return;
      if (error instanceof ApiError && error.kind === "unauthorized") {
        this.handleApiError(error);
        return;
      }
    }
    if (current() && this.state.sheet.status === "writing") {
      this.set({ sheet: { status: "error", reason: "unavailable" } });
    }
  }
}
