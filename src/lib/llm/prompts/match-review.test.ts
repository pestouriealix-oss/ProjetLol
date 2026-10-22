import { describe, expect, it } from "vitest";

import type { ReviewFacts } from "@/lib/stats/review";

import { matchReviewMessage, matchReviewSchema } from "./match-review";

const line = {
  championName: "LeeSin",
  kills: 5,
  deaths: 3,
  assists: 10,
  csPerMinute: 6,
  goldPerMinute: 400.4,
  damagePerMinute: 600.6,
  damageShare: 0.2,
  killParticipation: 0.6,
  visionPerMinute: 1,
  controlWards: 3,
};

const facts: ReviewFacts = {
  patch: "16.20",
  queueId: 420,
  win: true,
  durationMinutes: 30,
  role: "JUNGLE",
  me: line,
  opponent: { ...line, championName: "Ivern" },
  lane: [{ minute: 10, goldDiff: 200, csDiff: -4, xpDiff: 0 }],
  deaths: { times: [300, 840], beforeMinute15: 2, beforeEnemyObjective: 1 },
  teamGold: {
    at10: 1000,
    at20: null,
    final: 2000,
    biggestLead: { minute: 25, gold: 3500 },
    biggestDeficit: { minute: 3, gold: -200 },
  },
  objectives: {
    ours: { dragons: 3, grubs: 3, heralds: 1, barons: 1, towers: 8 },
    theirs: { dragons: 1, grubs: 0, heralds: 0, barons: 0, towers: 2 },
  },
  habits: null,
};

describe("matchReviewMessage", () => {
  const message = matchReviewMessage(facts, { me: "Lee Sin", opponent: "Ivern" });

  it("donne au modèle les faits de la partie, arrondis", () => {
    expect(message).toContain("Victoire en 30 minutes.");
    expect(message).toContain("Le joueur jouait Lee Sin au poste jungle, contre Ivern.");
    expect(message).toContain("Or par minute : 400");
    expect(message).toContain("à 10 minutes : or +200, CS −4, expérience 0");
    expect(message).toContain("Morts à 5:00, 14:00 : 2 avant 15 minutes, 1 dans la minute");
    expect(message).toContain("drakes 3/1");
  });

  it("dit quand les habitudes manquent", () => {
    expect(message).toContain("pas assez d'autres parties classées");
  });
});

describe("matchReviewSchema", () => {
  it("exige plusieurs options pour chaque axe de progrès", () => {
    const review = {
      summary: "Résumé.",
      focus: "Une seule mort avant 15 minutes.",
      strengths: [{ title: "Début", detail: "Avance de 200 or à 10 minutes." }],
      improvements: [
        { title: "Morts", detail: "Deux morts avant 15 minutes.", options: ["Une seule"] },
      ],
    };
    expect(matchReviewSchema.safeParse(review).success).toBe(false);
    review.improvements[0]!.options.push("Une autre");
    expect(matchReviewSchema.safeParse(review).success).toBe(true);
  });
});
