/** Identifiants Overwolf de League of Legends (voir la doc « games ids » et « launchers ids »). */
export const LOL_GAME_ID = 5426;
export const LOL_LAUNCHER_ID = 10902;

/** Ce que l'app lit du lanceur : l'étape (salon, sélection, partie…) et la sélection. */
export const LAUNCHER_FEATURES = ["game_flow", "champ_select"];
/** Ce que l'app lit de la partie : seulement de quoi savoir qu'elle a commencé. */
export const GAME_FEATURES = ["live_client_data", "matchState"];

export const WINDOWS = {
  background: "background",
  desktop: "desktop",
  inGame: "in_game",
} as const;
export type WindowName = (typeof WINDOWS)[keyof typeof WINDOWS];

/** Le raccourci déclaré dans manifest.json. */
export const SHEET_HOTKEY = "gufo_toggle_sheet";
