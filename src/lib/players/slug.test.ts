import { describe, expect, it } from "vitest";

import {
  canonicalPlayerPath,
  isSameRiotId,
  parsePlayerPath,
  playerPath,
  platformFromServer,
} from "./slug";

describe("adresse d'un profil", () => {
  it("fait l'aller-retour, même avec espaces, accents et tirets dans le pseudo", () => {
    for (const riotId of [
      { gameName: "PythonEnjoyer", tagLine: "EUWW" },
      { gameName: "Mid or Feed", tagLine: "LOL" },
      { gameName: "Hé-ho-Bébé", tagLine: "1234" },
    ]) {
      const path = playerPath("EUW1", riotId);
      const [, , server, slug] = path.split("/");
      expect(parsePlayerPath(server!, slug!)).toEqual({ platform: "EUW1", riotId });
    }
    expect(playerPath("KR", { gameName: "Faker", tagLine: "KR1" })).toBe("/joueur/kr/Faker-KR1");
  });

  it("refuse un serveur inconnu ou un Riot ID impossible", () => {
    expect(parsePlayerPath("mars", "Faker-KR1")).toBeNull();
    expect(parsePlayerPath("euw", "SansTag")).toBeNull();
    expect(parsePlayerPath("euw", "Pseudo-T!")).toBeNull();
    expect(parsePlayerPath("euw", "%E0%A4%A")).toBeNull();
  });

  it("reconnaît le serveur sous son nom court", () => {
    expect(platformFromServer("euw")).toBe("EUW1");
    expect(platformFromServer("OCE")).toBe("OC1");
    expect(platformFromServer("euw1")).toBeNull();
    expect(platformFromServer(undefined)).toBeNull();
  });

  it("ramène l'adresse à l'écriture de Riot, sans boucler", () => {
    const requested = { platform: "KR" as const, riotId: { gameName: "faker", tagLine: "kr1" } };
    const actual = { gameName: "Faker", tagLine: "KR1" };
    expect(canonicalPlayerPath(requested, actual)).toBe("/joueur/kr/Faker-KR1");
    expect(canonicalPlayerPath({ platform: "KR", riotId: actual }, actual)).toBeNull();
  });

  it("reconnaît un Riot ID quelle que soit la casse", () => {
    const riotId = { gameName: "PythonEnjoyer", tagLine: "EUWW" };
    expect(isSameRiotId(riotId, { gameName: "pythonenjoyer", tagLine: "euww" })).toBe(true);
    expect(isSameRiotId(riotId, { gameName: "PythonEnjoyer", tagLine: "EUW" })).toBe(false);
  });
});
