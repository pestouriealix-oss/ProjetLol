import { describe, expect, it } from "vitest";

import { createEsportApi } from "./client";
import { EsportApiError } from "./errors";

const respond =
  (status: number, body: unknown, seen: { url?: string; auth?: string } = {}) =>
  async (input: RequestInfo | URL, init?: RequestInit) => {
    seen.url = String(input);
    seen.auth = new Headers(init?.headers).get("authorization") ?? undefined;
    return new Response(JSON.stringify(body), { status });
  };

describe("client PandaScore", () => {
  it("envoie la clé dans l'en-tête et filtre les tournois par niveau", async () => {
    const seen: { url?: string; auth?: string } = {};
    const api = createEsportApi({
      token: "secret",
      baseUrl: "http://faux",
      fetch: respond(200, [], seen),
    });
    await api.listTournaments("running", ["s", "a"]);
    expect(seen.auth).toBe("Bearer secret");
    expect(seen.url).toBe(
      "http://faux/lol/tournaments/running?filter%5Btier%5D=s%2Ca&sort=begin_at&per_page=50",
    );
    // La clé ne passe jamais dans l'adresse, qui peut finir dans des journaux.
    expect(seen.url).not.toContain("secret");
  });

  it("traduit les échecs en erreurs utiles", async () => {
    const kind = async (api: ReturnType<typeof createEsportApi>) =>
      api.tournamentMatches(1).then(
        () => "ok",
        (error: unknown) => (error instanceof EsportApiError ? error.kind : "autre"),
      );
    expect(await kind(createEsportApi({ token: undefined }))).toBe("missing_key");
    expect(await kind(createEsportApi({ token: "x", fetch: respond(401, {}) }))).toBe(
      "invalid_key",
    );
    expect(await kind(createEsportApi({ token: "x", fetch: respond(429, {}) }))).toBe(
      "rate_limited",
    );
    expect(await kind(createEsportApi({ token: "x", fetch: respond(500, {}) }))).toBe(
      "unavailable",
    );
    expect(
      await kind(createEsportApi({ token: "x", fetch: respond(200, { pas: "une liste" }) })),
    ).toBe("unavailable");
  });

  it("rend une liste vide quand une étape n'a pas encore de classement, d'arbre ou de matchs", async () => {
    const api = createEsportApi({ token: "x", fetch: respond(404, { error: "Not found" }) });
    expect(await api.tournamentStandings(1)).toEqual([]);
    expect(await api.tournamentBracket(1)).toEqual([]);
    expect(await api.tournamentMatches(1)).toEqual([]);
  });

  it("garde le 404 comme une erreur pour la liste des compétitions", async () => {
    const api = createEsportApi({ token: "x", fetch: respond(404, {}) });
    await expect(api.listTournaments("running", ["s"])).rejects.toThrow(
      "PandaScore a répondu 404 pour /lol/tournaments/running.",
    );
  });
});
