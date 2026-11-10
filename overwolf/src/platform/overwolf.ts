import type { Platform, PlatformSignals } from "../core/controller";
import {
  GAME_FEATURES,
  LAUNCHER_FEATURES,
  LOL_GAME_ID,
  LOL_LAUNCHER_ID,
  SHEET_HOTKEY,
  WINDOWS,
  type WindowName,
} from "../core/ids";
import { findEntry, matchHasStarted, readEventNames, readInfoEntries } from "../core/launcher";

/**
 * Le contrôleur branché sur Overwolf : lanceur de League of Legends, partie,
 * raccourci et fenêtres. Rien ici ne décide : tout part vers le contrôleur.
 */

const RETRY_MS = 2000;
const MAX_RETRIES = 20;
/** Place de la fiche : contre le bord droit, sous le haut de l'écran. */
const SHEET_MARGIN = { right: 32, top: 96 };
const SHEET_WIDTH = 460;

const isLeague = (classId: number | undefined) =>
  classId !== undefined && Math.floor(classId) === LOL_GAME_ID;

/**
 * Overwolf n'accepte la demande de données qu'une fois le jeu (ou le lanceur)
 * prêt : on réessaie quelques secondes, comme le recommande sa doc.
 */
function requireFeatures(set: (done: (ok: boolean) => void) => void, attempt = 0) {
  set((ok) => {
    if (!ok && attempt < MAX_RETRIES) {
      setTimeout(() => requireFeatures(set, attempt + 1), RETRY_MS);
    }
  });
}

function withWindow(name: WindowName, action: (id: string) => void) {
  overwolf.windows.obtainDeclaredWindow(name, (result) => {
    if (result.success) action(result.window.id);
  });
}

export function overwolfPlatform(): Platform {
  const storage = {
    get: (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Stockage indisponible : l'app redemandera la liaison au prochain lancement.
      }
    },
    remove: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Rien à effacer.
      }
    },
  };

  return {
    storage,

    start(signals: PlatformSignals) {
      // ── Lanceur : salon, sélection, partie ──
      const readLauncher = (payload: unknown) => {
        const entries = readInfoEntries(payload);
        const phase = findEntry(entries, "game_flow", "phase");
        if (typeof phase === "string") signals.launcherPhase(phase);
        const raw = findEntry(entries, "champ_select", "raw");
        if (raw !== undefined) signals.champSelect(raw);
      };
      const watchLauncher = () =>
        requireFeatures((done) =>
          overwolf.games.launchers.events.setRequiredFeatures(
            LOL_LAUNCHER_ID,
            LAUNCHER_FEATURES,
            (result) => {
              done(result.success);
              if (!result.success) return;
              overwolf.games.launchers.events.getInfo(LOL_LAUNCHER_ID, (info) => {
                if (info.success && info.res) readLauncher({ info: info.res });
              });
            },
          ),
        );

      overwolf.games.launchers.events.onInfoUpdates.addListener(readLauncher);
      overwolf.games.launchers.onLaunched.addListener((launcher) => {
        if (launcher.classId === LOL_LAUNCHER_ID) watchLauncher();
      });
      overwolf.games.launchers.onTerminated.addListener((launcher) => {
        if (launcher.classId === LOL_LAUNCHER_ID) signals.launcherPhase(null);
      });
      overwolf.games.launchers.getRunningLaunchersInfo((result) => {
        const running =
          result.success && result.launchers.some((l) => l.classId === LOL_LAUNCHER_ID);
        if (running) watchLauncher();
        else signals.launcherPhase(null);
      });

      // ── Partie : chargement, puis horloge ──
      const watchGame = () =>
        requireFeatures((done) =>
          overwolf.games.events.setRequiredFeatures(GAME_FEATURES, (result) =>
            done(result.success),
          ),
        );
      overwolf.games.events.onInfoUpdates2.addListener((update) => {
        if (matchHasStarted(readInfoEntries(update), [])) signals.matchStarted();
      });
      overwolf.games.events.onNewEvents.addListener((events) => {
        if (matchHasStarted([], readEventNames(events))) signals.matchStarted();
      });
      overwolf.games.onGameInfoUpdated.addListener((event) => {
        const info = event.gameInfo;
        if (!info || !isLeague(info.classId)) return;
        if (event.runningChanged || event.gameChanged) {
          signals.gameRunning(info.isRunning);
          if (info.isRunning) watchGame();
        }
      });
      overwolf.games.getRunningGameInfo((info) => {
        const running = Boolean(info?.isRunning && isLeague(info.classId));
        signals.gameRunning(running);
        if (running) watchGame();
        // Ouverte par le joueur hors partie : la fenêtre de bureau s'affiche.
        else if (!location.href.includes("gamelaunchevent")) signals.openedByUser();
      });

      // ── Raccourci et relance de l'app ──
      overwolf.settings.hotkeys.onPressed.addListener((event) => {
        if (event.name === SHEET_HOTKEY) signals.hotkey();
      });
      overwolf.extensions.onAppLaunchTriggered.addListener((event) => {
        if (!event.origin.includes("gamelaunchevent")) signals.openedByUser();
      });
    },

    showWindow(name) {
      withWindow(name, (id) => {
        overwolf.windows.restore(id);
        if (name !== WINDOWS.inGame) return;
        overwolf.games.getRunningGameInfo((info) => {
          if (!info?.logicalWidth) return;
          const left = Math.max(0, info.logicalWidth - SHEET_WIDTH - SHEET_MARGIN.right);
          overwolf.windows.changePosition(id, left, SHEET_MARGIN.top);
        });
      });
    },

    hideWindow(name) {
      withWindow(name, (id) => overwolf.windows.hide(id));
    },

    openUrl(url) {
      overwolf.utils.openUrlInDefaultBrowser(url);
    },

    hotkeyBinding() {
      return new Promise((resolve) => {
        overwolf.settings.hotkeys.get((result) => {
          if (!result.success) return resolve(null);
          const all = [...(result.games?.[String(LOL_GAME_ID)] ?? []), ...result.globals];
          const hotkey = all.find((each) => each.name === SHEET_HOTKEY);
          resolve(hotkey && !hotkey.IsUnassigned ? hotkey.binding : null);
        });
      });
    },
  };
}

/** Pour les fenêtres visibles : déplacer, réduire, fermer la leur. */
export const windowControls = {
  drag(name: WindowName) {
    overwolf.windows.dragMove(name);
  },
  minimize(name: WindowName) {
    overwolf.windows.minimize(name);
  },
  close(name: WindowName) {
    overwolf.windows.close(name);
  },
};
