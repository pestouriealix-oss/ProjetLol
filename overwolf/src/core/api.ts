import { z } from "zod";

import { draftSchema, type Draft } from "@/lib/draft/draft";
import {
  readSheetView,
  sheetFactsSchema,
  type SheetFacts,
  type SheetView,
} from "@/lib/draft/sheet-view";

import { readNdjson } from "./ndjson";

/**
 * L'API de Gufo vue par l'app (`/api/app/*`). Chaque réponse est vérifiée :
 * ce qui ne colle pas devient une erreur, jamais une valeur devinée.
 */

export type ApiErrorKind = "unauthorized" | "rate_limited" | "network" | "server";

export class ApiError extends Error {
  constructor(readonly kind: ApiErrorKind) {
    super(kind);
    this.name = "ApiError";
  }
}

const linkSchema = z.object({
  deviceCode: z.string(),
  userCode: z.string(),
  expiresIn: z.number(),
  interval: z.number(),
});
export type LinkStart = z.infer<typeof linkSchema>;

const tokenSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("approved"), token: z.string() }),
  z.object({ status: z.literal("pending") }),
  z.object({ status: z.literal("expired") }),
]);
export type TokenResult = z.infer<typeof tokenSchema>;

const meSchema = z.object({
  name: z.string().nullable(),
  plan: z.enum(["FREE", "PREMIUM"]),
  founder: z.boolean(),
  trialEndsAt: z.string().nullable(),
  coachReady: z.boolean(),
  sheets: z.object({ limit: z.number(), remaining: z.number() }),
  accounts: z.array(
    z.object({
      gameName: z.string(),
      tagLine: z.string(),
      platform: z.string(),
      primary: z.boolean(),
      owned: z.boolean(),
    }),
  ),
});
export type Me = z.infer<typeof meSchema>;

const liveSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("found"), draft: z.unknown(), riotId: z.string() }),
  z.object({ status: z.literal("not_in_game") }),
  z.object({ status: z.literal("no_account") }),
  z.object({ status: z.literal("not_owned") }),
  z.object({ status: z.literal("unavailable") }),
]);
export type LiveResult =
  | { status: "found"; draft: Draft; riotId: string }
  | { status: "not_in_game" | "no_account" | "not_owned" | "unavailable" };

const championsSchema = z.object({
  version: z.string(),
  champions: z.array(
    z.object({ key: z.number(), id: z.string(), name: z.string(), iconUrl: z.string() }),
  ),
});
export type Champion = z.infer<typeof championsSchema>["champions"][number];

const sheetEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("facts"), facts: z.unknown() }),
  z.object({ type: z.literal("partial"), sheet: z.unknown() }),
  z.object({ type: z.literal("done"), id: z.string(), sheet: z.unknown(), facts: z.unknown() }),
  z.object({ type: z.literal("error"), error: z.string() }),
]);

export type SheetEvent =
  | { type: "facts"; facts: SheetFacts }
  | { type: "partial"; sheet: SheetView }
  | { type: "done"; id: string; sheet: SheetView }
  | { type: "error"; error: string };

type Fetch = typeof fetch;

export class GufoApi {
  constructor(
    readonly baseUrl: string,
    private readonly getToken: () => string | null,
    private readonly fetchImpl: Fetch = (...args) => fetch(...args),
  ) {}

  /** L'adresse d'une page du site (« /app?code=… »). */
  siteUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private async request(
    path: string,
    init: RequestInit & { auth?: boolean } = {},
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    if (init.auth !== false) {
      const token = this.getToken();
      if (!token) throw new ApiError("unauthorized");
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (init.body) headers.set("Content-Type", "application/json");
    let response: Response;
    try {
      response = await this.fetchImpl(this.siteUrl(path), { ...init, headers });
    } catch {
      throw new ApiError("network");
    }
    if (response.status === 401) throw new ApiError("unauthorized");
    if (response.status === 429 && path === "/api/app/link") throw new ApiError("rate_limited");
    return response;
  }

  private async json<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
    const parsed = schema.safeParse(await response.json().catch(() => null));
    if (!parsed.success) throw new ApiError("server");
    return parsed.data;
  }

  async startLink(): Promise<LinkStart> {
    const response = await this.request("/api/app/link", { method: "POST", auth: false });
    if (!response.ok) throw new ApiError("server");
    return this.json(response, linkSchema);
  }

  async pollToken(deviceCode: string): Promise<TokenResult> {
    const response = await this.request("/api/app/token", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ deviceCode }),
    });
    if (response.status >= 500) throw new ApiError("server");
    return this.json(response, tokenSchema);
  }

  async logout(): Promise<void> {
    await this.request("/api/app/token", { method: "DELETE" }).catch(() => undefined);
  }

  async me(): Promise<Me> {
    const response = await this.request("/api/app/me");
    if (!response.ok) throw new ApiError("server");
    return this.json(response, meSchema);
  }

  async live(): Promise<LiveResult> {
    const response = await this.request("/api/app/live");
    const result = await this.json(response, liveSchema);
    if (result.status !== "found") return result;
    const draft = draftSchema.safeParse(result.draft);
    if (!draft.success) throw new ApiError("server");
    return { status: "found", draft: draft.data, riotId: result.riotId };
  }

  async champions(): Promise<Champion[]> {
    const response = await this.request("/api/app/champions");
    if (!response.ok) throw new ApiError("server");
    return (await this.json(response, championsSchema)).champions;
  }

  /** La fiche, morceau par morceau, comme sur le site. */
  async *sheet(draft: Draft, signal?: AbortSignal): AsyncGenerator<SheetEvent> {
    const response = await this.request("/api/app/sheet", {
      method: "POST",
      body: JSON.stringify({ draft }),
      signal,
    });
    if (!response.body) throw new ApiError("server");
    for await (const raw of readNdjson(response.body)) {
      const event = sheetEventSchema.safeParse(raw);
      if (!event.success) continue;
      const value = event.data;
      if (value.type === "facts") {
        const facts = sheetFactsSchema.safeParse(value.facts);
        if (facts.success) yield { type: "facts", facts: facts.data };
      } else if (value.type === "partial") {
        yield { type: "partial", sheet: readSheetView(value.sheet) };
      } else if (value.type === "done") {
        const facts = sheetFactsSchema.safeParse(value.facts);
        yield {
          type: "done",
          id: value.id,
          sheet: { ...readSheetView(value.sheet), facts: facts.success ? facts.data : undefined },
        };
      } else {
        yield value;
      }
    }
  }
}
