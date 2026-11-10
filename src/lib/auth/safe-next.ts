/**
 * Où revenir après la connexion (`?next=`) : uniquement une page de ce site.
 * Une adresse absolue ou « //autre-site » renverrait ailleurs (redirection
 * ouverte) : elle est ignorée.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || value.length > 300) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}
