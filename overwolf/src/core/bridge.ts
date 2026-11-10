import type { Controller } from "./controller";

/**
 * Les fenêtres visibles retrouvent le contrôleur dans la fenêtre cachée
 * (`overwolf.windows.getMainWindow()`), qui le range sous ce nom.
 */
declare global {
  interface Window {
    gufo?: Controller;
  }
}

export function findController(): Controller | null {
  if (typeof overwolf !== "undefined") return overwolf.windows.getMainWindow().gufo ?? null;
  return window.gufo ?? null;
}
