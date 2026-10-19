import "server-only";
import { eq } from "drizzle-orm";

import { db } from "./client";
import { matchupNotes } from "./schema";

/**
 * Duels déjà écrits, communs à tous les utilisateurs : aucune donnée
 * personnelle, seulement le texte du duel et sa clé.
 */

/** Le contenu gardé pour cette clé, ou `null`. À valider par l'appelant. */
export async function findMatchupNote(key: string): Promise<unknown> {
  const [row] = await db
    .select({ content: matchupNotes.content })
    .from(matchupNotes)
    .where(eq(matchupNotes.key, key))
    .limit(1);
  return row?.content ?? null;
}

/** Garde un duel écrit. Si deux joueurs l'ont fait écrire en même temps, le premier reste. */
export async function saveMatchupNote(note: {
  key: string;
  patch: string;
  model: string;
  promptVersion: string;
  content: unknown;
}): Promise<void> {
  await db.insert(matchupNotes).values(note).onConflictDoNothing();
}
