import Anthropic from "@anthropic-ai/sdk";

import { LlmError } from "./errors";
import type { LlmUsage } from "./pricing";

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
  /** Reçoit les tokens consommés par l'appel (pour le suivi des coûts). */
  onUsage?: (usage: LlmUsage) => void;
  /** Nouveaux essais quand la réponse est hors format (1 par défaut). */
  retries?: number;
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
        // La partie fixe (outil + instructions) est mise en cache chez Anthropic :
        // facturée bien moins cher d'un appel à l'autre.
        system: [
          {
            type: "text" as const,
            text: call.system,
            cache_control: { type: "ephemeral" as const },
          },
        ],
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

  const finish = <T>(message: Anthropic.Message, call: ToolCall<T>): T => {
    const tool = call.tool;
    call.onUsage?.({
      model: call.model,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
      cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
    });
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
      for (let attempt = 0; ; attempt += 1) {
        try {
          return finish(await client.messages.create(params), call);
        } catch (error) {
          const failure = toLlmError(error);
          if (!retryable(failure, attempt, call)) throw failure;
          console.warn("Réponse hors format, nouvel essai", failure.message);
        }
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
      for (let attempt = 0; ; attempt += 1) {
        try {
          const stream = client.messages.stream(params, { signal });
          stream.on("inputJson", (_delta, snapshot) => onPartial(snapshot));
          return finish(await stream.finalMessage(), call);
        } catch (error) {
          const failure = toLlmError(error);
          if (signal?.aborted || !retryable(failure, attempt, call)) throw failure;
          console.warn("Réponse hors format, nouvel essai", failure.message);
          // Le nouvel essai repart de zéro : la page efface ce qui était écrit.
          onPartial({});
        }
      }
    },
  };
}

/** Une réponse hors format mérite un nouvel essai : le modèle répond rarement deux fois de travers. */
function retryable(error: LlmError, attempt: number, call: { retries?: number }): boolean {
  return error.kind === "invalid_output" && attempt < (call.retries ?? 1);
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
