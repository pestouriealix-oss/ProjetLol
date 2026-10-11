import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";

import { findUserById, type CurrentUser } from "@/lib/db/users";

import { auth } from "./index";

/**
 * Utilisateur connecté, relu en base à chaque requête (une seule fois grâce à
 * `cache`). Le jeton de session ne porte que l'identifiant : un compte supprimé
 * ou un changement d'offre prend donc effet immédiatement.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return findUserById(userId);
});

/** À appeler en tête de chaque page, action ou route protégée. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
