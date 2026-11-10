/**
 * Où en est le joueur, de l'ouverture du client à la fin de la partie. C'est
 * ce qui décide de ce que montrent les fenêtres.
 */
export type Stage =
  /** Le client de League of Legends n'est pas ouvert. */
  | "offline"
  /** Client ouvert : salon, file d'attente. */
  | "lobby"
  /** Sélection des champions. */
  | "champ_select"
  /** Écran de chargement : le moment de la fiche. */
  | "loading"
  /** La partie a commencé : la fiche se range vers 1:30 ; le raccourci la rouvre. */
  | "in_game"
  /** Fin de partie : direction le bilan. */
  | "after_game";

const AFTER_GAME = new Set(["WaitingForStats", "PreEndOfGame", "EndOfGame"]);
const STARTING = new Set(["GameStart", "InProgress", "Reconnect"]);

export function stageFrom(input: {
  /** L'étape du lanceur (`game_flow.phase`), `null` s'il est fermé. */
  launcherPhase: string | null;
  gameRunning: boolean;
  matchStarted: boolean;
}): Stage {
  if (input.gameRunning) return input.matchStarted ? "in_game" : "loading";
  const phase = input.launcherPhase;
  if (phase === null) return "offline";
  if (phase === "ChampSelect") return "champ_select";
  if (AFTER_GAME.has(phase)) return "after_game";
  // La partie se lance, mais Overwolf ne l'a pas encore vue tourner.
  if (STARTING.has(phase)) return "loading";
  return "lobby";
}
