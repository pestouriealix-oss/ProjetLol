import Anthropic from "@anthropic-ai/sdk";

import { LlmError } from "./errors";

/**
 * Appels au modèle, toujours sous la forme d'un outil imposé : le modèle
 * répond en remplissant un objet JSON au schéma fixé (mode strict), que
 * l'appelant valide ensuite avec Zod. Jamais de texte libre à découper.
 */

export type ToolSpec<T> = {
  name: string;
  description: string;
  /** Schéma JSON envoyé au modèle (types seulement : le mode strict refuse les bornes). */
  inputSchema: Record<string, unknown>;
  /** Validation complète de la réponse (bornes, cohérence). Lève une erreur si elle échoue. */
  parse: (input: unknown) => T;
};

export type ToolCall<T> = {
  model: string;
  system: string;
  content: Anthropic.MessageParam["content"];
  tool: ToolSpec<T>;
  maxTokens: number;
};

export type LlmClientOptions = {
  apiKey: string | undefined;
  baseURL?: string;
  timeoutMs?: number;
};

export type Llm = ReturnType<typeof createLlm>;

export function createLlm({ apiKey, baseURL, timeoutMs = 60_000 }: LlmClientOptions) {
  const client = apiKey
    ? new Anthropic({ apiKey, baseURL, timeout: timeoutMs, maxRetries: 1 })
    : null;

  const request = <T>(call: ToolCall<T>) => {
    if (!client) throw new LlmError("missing_key", "ANTHROPIC_API_KEY n'est pas définie.");
    return {
      client,
      params: {
        model: call.model,
        max_tokens: call.maxTokens,
        system: call.system,
        messages: [{ role: "user" as const, content: call.content }],
        tools: [
          {
            name: call.tool.name,
            description: call.tool.description,
            input_schema: call.tool.inputSchema as Anthropic.Tool.InputSchema,
            strict: true,
            eager_input_streaming: true,
          },
        ],
        tool_choice: { type: "tool" as const, name: call.tool.name },
      },
    };
  };

  const finish = <T>(message: Anthropic.Message, tool: ToolSpec<T>): T => {
    if (message.stop_reason === "refusal") {
      throw new LlmError("refused", "Le modèle a refusé de répondre.");
    }
    const block = message.content.find(
      (candidate): candidate is Anthropic.ToolUseBlock =>
        candidate.type === "tool_use" && candidate.name === tool.name,
    );
    if (!block) throw new LlmError("invalid_output", "Le modèle n'a pas rempli l'outil demandé.");
    try {
      return tool.parse(block.input);
    } catch (error) {
      throw new LlmError("invalid_output", `Réponse du modèle hors format : ${String(error)}`);
    }
  };

  return {
    isConfigured: client !== null,

    /** Un appel complet : la réponse validée, d'un bloc. */
    async callTool<T>(call: ToolCall<T>): Promise<T> {
      const { client, params } = request(call);
      try {
        return finish(await client.messages.create(params), call.tool);
      } catch (error) {
        throw toLlmError(error);
      }
    },

    /**
     * Un appel diffusé : `onPartial` reçoit l'objet en cours d'écriture à chaque
     * morceau (champs incomplets, listes en cours), puis la réponse validée est
     * rendue à la fin.
     */
    async streamTool<T>(
      call: ToolCall<T>,
      onPartial: (partial: unknown) => void,
      signal?: AbortSignal,
    ): Promise<T> {
      const { client, params } = request(call);
      try {
        const stream = client.messages.stream(params, { signal });
        stream.on("inputJson", (_delta, snapshot) => onPartial(snapshot));
        return finish(await stream.finalMessage(), call.tool);
      } catch (error) {
        throw toLlmError(error);
      }
    },
  };
}

/** Traduit les erreurs du SDK en erreurs que la page sait expliquer. */
export function toLlmError(error: unknown): LlmError {
  if (error instanceof LlmError) return error;
  if (
    error instanceof Anthropic.AuthenticationError ||
    error instanceof Anthropic.PermissionDeniedError
  ) {
    return new LlmError("invalid_key", `Clé Anthropic refusée (${error.status}).`);
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new LlmError("rate_limited", "Limite d'appels de l'API Anthropic atteinte.");
  }
  if (error instanceof Anthropic.APIError) {
    // 400 avec un message de crédit insuffisant : c'est un problème de compte, pas du site.
    if (error.status === 400 && /credit|billing/i.test(error.message)) {
      return new LlmError("invalid_key", "Crédit Anthropic insuffisant.");
    }
    return new LlmError(
      "unavailable",
      `L'API Anthropic a répondu ${error.status ?? "?"} : ${error.message}`,
    );
  }
  return new LlmError("unavailable", `L'API Anthropic ne répond pas : ${String(error)}`);
}
