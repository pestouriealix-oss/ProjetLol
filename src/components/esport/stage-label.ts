import { t } from "@/i18n/fr";

const KEYS: [RegExp, string][] = [
  [/play-?in/i, "play-in"],
  [/swiss|suisse/i, "swiss"],
  [/knockout|elimination/i, "knockout"],
  [/playoff/i, "playoffs"],
  [/group/i, "groups"],
  [/regular|season/i, "regular"],
];

/** Nom français d'une étape (« Swiss Stage » → « Phase suisse ») ; à défaut, celui de PandaScore. */
export function stageLabel(name: string): string {
  const key = KEYS.find(([pattern]) => pattern.test(name))?.[1];
  return (key && t.esport.stageNames[key]) || name;
}
