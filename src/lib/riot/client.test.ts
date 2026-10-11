import { describe, expect, it, vi } from "vitest";

import { createRiotApi } from "./api";
import { createRiotClient } from "./client";
import { RiotApiError } from "./errors";
import { leagueEntriesFixture, matchFixture } from "./fixtures";

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), { status: 200, ...init });

function setup(responses: Response[], apiKey: string | undefined = "RGAPI-test") {
  const fetchMock = vi.fn<typeof fetch>(async () => {
    const next = responses.shift();
    if (!next) throw new Error("appel inattendu");
    return next;
  });
  const sleep = vi.fn(async () => {});
  const api = createRiotApi(createRiotClient({ apiKey, fetch: fetchMock, sleep }));
  return { api, fetchMock, sleep };
}

const expectKind = async (promise: Promise<unknown>, kind: RiotApiError["kind"]) => {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(RiotApiError);
  expect((error as RiotApiError).kind).toBe(kind);
};

describe("client de l'API Riot", () => {
  it("appelle le bon serveur pour chaque type de donnée, avec la clé en en-tête", async () => {
    const { api, fetchMock } = setup([
      json({ puuid: "p1", gameName: "Akiixxx", tagLine: "EUWW" }),
      json(leagueEntriesFixture),
      json(["EUW1_1", "EUW1_2"]),
      json(matchFixture()),
    ]);

    await api.getAccountByRiotId("EUW1", "Smurf dimanche", "EUW");
    await api.getLeagueEntries("EUW1", "p1");
    await api.getRankedMatchIds("EUW1", "p1", 20);
    await api.getMatch("EUW1", "EUW1_1");

    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls).toEqual([
      "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Smurf%20dimanche/EUW",
      "https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/p1",
      "https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/p1/ids?type=ranked&start=0&count=20",
      "https://europe.api.riotgames.com/lol/match/v5/matches/EUW1_1",
    ]);
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({ "X-Riot-Token": "RGAPI-test" });
  });

  it("sert les comptes d'Asie du Sud-Est depuis le serveur « asia »", async () => {
    const { api, fetchMock } = setup([
      json({ puuid: "p", gameName: "A", tagLine: "B" }),
      json(["SG2_1"]),
    ]);
    await api.getAccountByRiotId("SG2", "Joueur", "SG2");
    await api.getRankedMatchIds("SG2", "p", 5);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("https://asia.api.riotgames.com/");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("https://sea.api.riotgames.com/");
  });

  it("refuse d'appeler Riot sans clé", async () => {
    const { api, fetchMock } = setup([], "");
    await expectKind(api.getMatch("EUW1", "EUW1_1"), "missing_key");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("traduit les erreurs de Riot", async () => {
    const { api } = setup([
      new Response("", { status: 403 }),
      new Response("", { status: 404 }),
      new Response("", { status: 503 }),
      json({ inattendu: true }),
    ]);
    await expectKind(api.getMatch("EUW1", "a"), "invalid_key");
    await expectKind(api.getMatch("EUW1", "b"), "not_found");
    await expectKind(api.getMatch("EUW1", "c"), "unavailable");
    await expectKind(api.getMatch("EUW1", "d"), "unavailable");
  });

  it("patiente une fois quand Riot demande d'attendre, puis reprend", async () => {
    const { api, sleep } = setup([
      new Response("", { status: 429, headers: { "retry-after": "2" } }),
      json(["EUW1_1"]),
    ]);
    await expect(api.getRankedMatchIds("EUW1", "p", 20)).resolves.toEqual(["EUW1_1"]);
    expect(sleep).toHaveBeenCalledExactlyOnceWith(2000);
  });

  it("abandonne si l'attente demandée est longue ou se répète", async () => {
    const long = setup([new Response("", { status: 429, headers: { "retry-after": "90" } })]);
    await expectKind(long.api.getMatch("EUW1", "a"), "rate_limited");
    expect(long.sleep).not.toHaveBeenCalled();

    const twice = setup([
      new Response("", { status: 429, headers: { "retry-after": "1" } }),
      new Response("", { status: 429, headers: { "retry-after": "1" } }),
    ]);
    await expectKind(twice.api.getMatch("EUW1", "a"), "rate_limited");
  });

  it("signale une panne réseau comme une indisponibilité", async () => {
    const api = createRiotApi(
      createRiotClient({
        apiKey: "k",
        fetch: (async () => {
          throw new TypeError("fetch failed");
        }) as typeof fetch,
      }),
    );
    await expectKind(api.getMatch("EUW1", "a"), "unavailable");
  });
});
