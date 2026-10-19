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
