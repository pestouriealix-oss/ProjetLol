/**
 * Prix de l'API Anthropic, en dollars par million de tokens (tarifs publiés,
 * https://platform.claude.com/docs/en/about-claude/pricing, relevés le
 * 19 octobre 2026). À mettre à jour si Anthropic change ses prix : seul le
 * suivi des coûts en dépend, jamais le fonctionnement du site.
 */
type ModelPrice = { input: number; output: number; cacheWrite: number; cacheRead: number };

const PRICES: Record<string, ModelPrice> = {
  "claude-sonnet-5-5": { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.1 },
  // Tarif des requêtes de moins de 100 000 tokens : celles du coach en font quelques milliers.
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 },
  "claude-opus-5-5": { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 },
};

export type LlmUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
};

/** Coût d'un appel en millionièmes de dollar (entier) ; 0 pour un modèle inconnu. */
export function costMicroUsd(usage: LlmUsage): number {
  const price = PRICES[usage.model];
  if (!price) return 0;
  // Prix par million de tokens × tokens = millionièmes de dollar.
  return Math.round(
    usage.inputTokens * price.input +
      usage.outputTokens * price.output +
      usage.cacheWriteTokens * price.cacheWrite +
      usage.cacheReadTokens * price.cacheRead,
  );
}
