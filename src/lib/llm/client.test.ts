import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";

import { createLlm, toLlmError, type ToolSpec } from "./client";
import { LlmError } from "./errors";

const tool: ToolSpec<{ ok: boolean }> = {
  name: "outil",
  description: "Test",
  inputSchema: { type: "object", properties: { ok: { type: "boolean" } } },
  parse: (input) => ({ ok: Boolean((input as { ok?: unknown }).ok) }),
};

const apiError = (status: number, message = "erreur") =>
  Anthropic.APIError.generate(status, { error: { message } }, message, new Headers());

describe("createLlm", () => {
  it("signale une clé manquante sans appeler le service", async () => {
    const llm = createLlm({ apiKey: undefined });
    expect(llm.isConfigured).toBe(false);
    await expect(
      llm.callTool({ model: "m", system: "s", content: "c", tool, maxTokens: 10 }),
    ).rejects.toMatchObject({ kind: "missing_key" });
  });
});

describe("toLlmError", () => {
  it("traduit les réponses du service en erreurs que la page sait expliquer", () => {
    expect(toLlmError(apiError(401)).kind).toBe("invalid_key");
    expect(toLlmError(apiError(403)).kind).toBe("invalid_key");
    expect(toLlmError(apiError(429)).kind).toBe("rate_limited");
    expect(toLlmError(apiError(529)).kind).toBe("unavailable");
    expect(toLlmError(apiError(400, "Your credit balance is too low")).kind).toBe("invalid_key");
    expect(toLlmError(new Error("réseau")).kind).toBe("unavailable");
  });

  it("laisse passer une erreur déjà traduite", () => {
    const error = new LlmError("refused", "non");
    expect(toLlmError(error)).toBe(error);
  });
});

describe("réponse hors format", () => {
  it("refait l'appel une fois, puis renvoie la réponse valide", async () => {
    const inputs = [{ ok: "pas un booléen" }, { ok: true }];
    let calls = 0;
    const server = createServer((request, response) => {
      request.resume();
      request.on("end", () => {
        const input = inputs[Math.min(calls, inputs.length - 1)];
        calls += 1;
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            id: `msg_${calls}`,
            type: "message",
            role: "assistant",
            model: "m",
            content: [{ type: "tool_use", id: "t", name: "outil", input }],
            stop_reason: "tool_use",
            stop_sequence: null,
            usage: { input_tokens: 1, output_tokens: 1 },
          }),
        );
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    const strict: ToolSpec<{ ok: boolean }> = {
      ...tool,
      parse: (input) => {
        const ok = (input as { ok?: unknown }).ok;
        if (typeof ok !== "boolean") throw new Error("hors format");
        return { ok };
      },
    };
    try {
      const llm = createLlm({ apiKey: "cle", baseURL: `http://127.0.0.1:${port}` });
      const call = { model: "m", system: "s", content: "c", tool: strict, maxTokens: 10 };
      await expect(llm.callTool(call)).resolves.toEqual({ ok: true });
      expect(calls).toBe(2);
      calls = 0;
      await expect(llm.callTool({ ...call, retries: 0 })).rejects.toMatchObject({
        kind: "invalid_output",
      });
    } finally {
      server.close();
    }
  });
});
