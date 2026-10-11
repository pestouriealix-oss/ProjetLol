import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("accepte le bon mot de passe", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
  });

  it("refuse un mauvais mot de passe", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse batterz", hash)).toBe(false);
  });

  it("ne stocke jamais le mot de passe en clair et sale chaque empreinte", async () => {
    const first = await hashPassword("même-mot-de-passe");
    const second = await hashPassword("même-mot-de-passe");
    expect(first).not.toContain("même-mot-de-passe");
    expect(first).not.toBe(second);
  });

  it("gère les caractères non ASCII", async () => {
    const hash = await hashPassword("pässwörd-日本語-🔥");
    expect(await verifyPassword("pässwörd-日本語-🔥", hash)).toBe(true);
  });

  it.each([
    "",
    "pas-un-hash",
    "bcrypt$1$2$3$a$b",
    "scrypt$0$8$1$c2Vs$a2V5",
    "scrypt$x$8$1$c2Vs$a2V5",
  ])("refuse une empreinte invalide sans lever d'erreur (%j)", async (stored) => {
    expect(await verifyPassword("peu importe", stored)).toBe(false);
  });
});
