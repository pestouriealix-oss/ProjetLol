/**
 * Tests d'intégration sur une vraie base : le compteur d'essais. Ignorés sans
 * DATABASE_URL.
 */
import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("limitation des essais", () => {
  it("bloque au-delà du maximum, puis repart à zéro une fois la fenêtre passée", async () => {
    const api = await import("./auth-attempts");
    const key = api.attemptKey("test", randomUUID());
    const start = new Date("2026-10-15T12:00:00Z");
    const later = (seconds: number) => new Date(start.getTime() + seconds * 1000);

    for (let attempt = 1; attempt <= 3; attempt++) {
      expect(await api.recordAttempt(key, 60, later(attempt))).toBe(attempt);
    }
    expect(await api.isRateLimited(key, 3, later(10))).toBe(true);
    expect(await api.isRateLimited(key, 4, later(10))).toBe(false);

    // Fenêtre passée : plus de blocage, et le compte repart de un.
    expect(await api.isRateLimited(key, 3, later(120))).toBe(false);
    expect(await api.recordAttempt(key, 60, later(120))).toBe(1);

    await api.clearAttempts(key);
    expect(await api.isRateLimited(key, 1, later(121))).toBe(false);
  });

  it("ne stocke jamais la valeur en clair", async () => {
    const { attemptKey } = await import("./auth-attempts");
    const key = attemptKey("login", "Alix@Example.test");
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).toBe(attemptKey("login", "alix@example.test "));
  });
});
