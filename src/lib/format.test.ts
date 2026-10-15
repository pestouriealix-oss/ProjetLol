import { describe, expect, it } from "vitest";

import {
  formatDayHeading,
  formatDecimal,
  formatDuration,
  formatLongDate,
  formatPercent,
  formatRelative,
  formatShortDate,
  formatTime,
} from "./format";

describe("mise en forme", () => {
  it("écrit les nombres à la française", () => {
    expect(formatDecimal(8)).toBe("8,0");
    expect(formatPercent(0.526)).toBe("53 %");
  });

  it("écrit la durée d'une partie en minutes et secondes", () => {
    expect(formatDuration(1754)).toBe("29:14");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3725)).toBe("62:05");
  });

  it("situe une date par rapport à maintenant", () => {
    const now = new Date("2026-10-11T12:00:00Z");
    const ago = (seconds: number) => formatRelative(new Date(now.getTime() - seconds * 1000), now);
    expect(ago(20)).toBe("à l'instant");
    expect(ago(5 * 60)).toBe("il y a 5 minutes");
    expect(ago(3 * 3600)).toBe("il y a 3 heures");
    expect(ago(26 * 3600)).toBe("hier");
    expect(ago(4 * 24 * 3600)).toBe("il y a 4 jours");
  });
});

describe("dates de l'esport", () => {
  const words = { today: "Aujourd'hui", tomorrow: "Demain", yesterday: "Hier" };
  const now = new Date("2026-10-15T10:00:00Z");

  it("affiche l'heure et les jours à l'heure de Paris", () => {
    expect(formatTime(new Date("2026-10-15T16:00:00Z"))).toBe("18:00");
    expect(formatShortDate(new Date("2026-10-15T23:30:00Z"))).toBe("16 oct.");
    expect(formatLongDate(new Date("2026-11-14T19:00:00Z"))).toBe("14 novembre");
  });

  it("nomme les jours proches, et écrit les autres en toutes lettres", () => {
    expect(formatDayHeading("2026-10-15", now, words)).toBe("Aujourd'hui");
    expect(formatDayHeading("2026-10-16", now, words)).toBe("Demain");
    expect(formatDayHeading("2026-10-14", now, words)).toBe("Hier");
    expect(formatDayHeading("2026-10-23", now, words)).toBe("Vendredi 23 octobre");
  });
});
