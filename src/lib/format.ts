/** Mise en forme des nombres, durées et dates pour l'interface (français). */

const decimal = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat("fr-FR");
const relative = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

/** « 8,0 » */
export const formatDecimal = (value: number) => decimal.format(value);

/** « 12 400 » */
export const formatInteger = (value: number) => integer.format(value);

/** Part de 0 à 1 vers « 53 % » (avec l'espace insécable d'usage). */
export const formatPercent = (ratio: number) => `${Math.round(ratio * 100)} %`;

/** Durée d'une partie : « 29:14 ». */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** « il y a 3 heures », « hier », « à l'instant ». */
export function formatRelative(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.trunc(seconds / size), unit);
  }
  return "à l'instant";
}
