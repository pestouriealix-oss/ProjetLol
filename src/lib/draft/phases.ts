/**
 * Découpage d'une partie en trois phases, en minutes. Les bornes suivent les
 * repères habituels : la phase de voies se termine vers 14 minutes, la fin de
 * partie commence vers 25.
 */
export const GAME_PHASES = [
  { id: "early", from: 0, to: 14 },
  { id: "mid", from: 14, to: 25 },
  { id: "late", from: 25, to: 40 },
] as const;
