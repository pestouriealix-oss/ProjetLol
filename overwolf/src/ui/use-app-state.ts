import { useSyncExternalStore } from "react";

import type { AppState, Controller } from "../core/controller";

/** L'état du contrôleur, relu à chaque changement. */
export function useAppState(controller: Controller): AppState {
  return useSyncExternalStore(
    (onChange) => controller.subscribe(onChange),
    () => controller.getState(),
  );
}
