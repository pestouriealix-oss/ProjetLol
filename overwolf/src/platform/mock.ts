import type { Platform, PlatformSignals } from "../core/controller";
import { WINDOWS, type WindowName } from "../core/ids";

/**
 * Overwolf pour rire : le banc d'essai (`npm run dev`, dans un navigateur
 * ordinaire) déclenche lui-même les étapes du client et affiche les deux
 * fenêtres côte à côte.
 */
export type MockPlatform = Platform & {
  signals: () => PlatformSignals | null;
  visible: (name: WindowName) => boolean;
  onWindowsChange: (listener: () => void) => () => void;
};

export function mockPlatform(): MockPlatform {
  let signals: PlatformSignals | null = null;
  const shown = new Set<WindowName>([WINDOWS.desktop]);
  const listeners = new Set<() => void>();
  const changed = () => listeners.forEach((listener) => listener());

  return {
    start: (value) => {
      signals = value;
    },
    signals: () => signals,
    showWindow: (name) => {
      shown.add(name);
      changed();
    },
    hideWindow: (name) => {
      shown.delete(name);
      changed();
    },
    visible: (name) => shown.has(name),
    onWindowsChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    openUrl: (url) => window.open(url, "_blank", "noopener"),
    hotkeyBinding: async () => "Ctrl+Shift+G",
    storage: {
      get: (key) => localStorage.getItem(key),
      set: (key, value) => localStorage.setItem(key, value),
      remove: (key) => localStorage.removeItem(key),
    },
  };
}

/** Une sélection telle que le lanceur l'envoie : Ahri au milieu. */
export const SAMPLE_CHAMP_SELECT = JSON.stringify({
  localPlayerCellId: 2,
  myTeam: [
    { cellId: 0, championId: 86, championPickIntent: 0, assignedPosition: "top" },
    { cellId: 1, championId: 64, championPickIntent: 0, assignedPosition: "jungle" },
    { cellId: 2, championId: 103, championPickIntent: 0, assignedPosition: "middle" },
  ],
  theirTeam: [{ cellId: 5, championId: 0, puuid: "" }],
});
