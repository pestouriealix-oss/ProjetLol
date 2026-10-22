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

/** Écart arrondi avec son signe : « +1 250 », « −340 », « 0 ». */
export const formatSignedInteger = (value: number) => {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${integer.format(Math.abs(rounded))}`;
};

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

/** Fuseau des heures affichées pour l'esport (l'application parle aux joueurs de France). */
export const DISPLAY_TIME_ZONE = "Europe/Paris";

/** « 18:00 », à l'heure de Paris. */
export function formatTime(date: Date, timeZone: string = DISPLAY_TIME_ZONE): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone, hour: "2-digit", minute: "2-digit" }).format(
    date,
  );
}

/** « 15 oct. », à l'heure de Paris. */
export function formatShortDate(date: Date, timeZone: string = DISPLAY_TIME_ZONE): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone, day: "numeric", month: "short" }).format(
    date,
  );
}

/** « 15 octobre », à l'heure de Paris. */
export function formatLongDate(date: Date, timeZone: string = DISPLAY_TIME_ZONE): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone, day: "numeric", month: "long" }).format(date);
}

/**
 * Titre d'un jour de calendrier (« 2026-10-15 ») : « Aujourd'hui », « Demain »,
 * « Hier », sinon « Jeudi 15 octobre ».
 */
export function formatDayHeading(
  day: string,
  now: Date,
  words: { today: string; tomorrow: string; yesterday: string },
  timeZone: string = DISPLAY_TIME_ZONE,
): string {
  const key = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  const shift = (days: number) => key(new Date(now.getTime() + days * 24 * 3600 * 1000));
  if (day === key(now)) return words.today;
  if (day === shift(1)) return words.tomorrow;
  if (day === shift(-1)) return words.yesterday;
  // Midi UTC : le même jour calendaire quel que soit le fuseau d'Europe.
  const label = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${day}T12:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Typographie française : espace insécable avant « : ; ! ? » et à l'intérieur
 * des guillemets, pour qu'un signe ne se retrouve jamais seul en début de ligne.
 */
export function frenchSpacing(value: string): string {
  return value.replace(/ ([:;!?»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
}
