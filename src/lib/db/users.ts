import "server-only";
import { and, eq, sql } from "drizzle-orm";

import { db } from "./client";
import { users } from "./schema";

/** Les seuls champs utilisateur qui sortent de la couche de données. */
export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: "FREE" | "PREMIUM";
  /** Adresse confirmée (lien reçu par e-mail, ou compte Discord vérifié). */
  emailVerified: boolean;
};

const publicColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  image: users.image,
  plan: users.plan,
  emailVerifiedAt: users.emailVerified,
};

type PublicRow = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: "FREE" | "PREMIUM";
  emailVerifiedAt: Date | null;
};

const toCurrentUser = ({ emailVerifiedAt, ...user }: PublicRow): CurrentUser => ({
  ...user,
  emailVerified: emailVerifiedAt !== null,
});

export async function findUserById(id: string): Promise<CurrentUser | null> {
  const [user] = await db.select(publicColumns).from(users).where(eq(users.id, id)).limit(1);
  return user ? toCurrentUser(user) : null;
}

/**
 * L'utilisateur d'une session, avec la date du dernier changement de mot de
 * passe : une session ouverte avant ne vaut plus.
 */
export async function findSessionUser(
  id: string,
): Promise<{ user: CurrentUser; passwordChangedAt: Date | null } | null> {
  const [row] = await db
    .select({ ...publicColumns, passwordChangedAt: users.passwordChangedAt })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!row) return null;
  const { passwordChangedAt, ...user } = row;
  return { user: toCurrentUser(user), passwordChangedAt };
}

/** Marque l'adresse comme vérifiée, si c'est toujours celle du compte. */
export async function markEmailVerified(
  userId: string,
  email: string,
  now = new Date(),
): Promise<boolean> {
  const updated = await db
    .update(users)
    .set({ emailVerified: now })
    .where(and(eq(users.id, userId), eq(users.email, email)))
    .returning({ id: users.id });
  return updated.length > 0;
}

/**
 * Nouveau mot de passe (lien « mot de passe oublié ») : il remplace l'ancien,
 * ferme les autres sessions, et vaut preuve que l'adresse est bien à lui.
 */
export async function setPassword(
  userId: string,
  passwordHash: string,
  now = new Date(),
): Promise<void> {
  await db
    .update(users)
    .set({
      passwordHash,
      passwordChangedAt: now,
      emailVerified: sql`coalesce(${users.emailVerified}, ${now})`,
    })
    .where(eq(users.id, userId));
}

/** Pour l'envoi d'un lien « mot de passe oublié » : l'identifiant du compte à cette adresse. */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user?.id ?? null;
}

/** Réservé à la vérification du mot de passe : renvoie l'empreinte. */
export async function findUserCredentials(email: string) {
  const [user] = await db
    .select({ ...publicColumns, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
}

export class EmailTakenError extends Error {
  constructor() {
    super("email_taken");
    this.name = "EmailTakenError";
  }
}

export async function createUserWithPassword(input: {
  email: string;
  name: string | null;
  passwordHash: string;
}): Promise<CurrentUser> {
  // La contrainte d'unicité tranche les inscriptions simultanées : pas de
  // « vérifier puis insérer », qui laisserait une fenêtre de course.
  const [user] = await db
    .insert(users)
    .values(input)
    .onConflictDoNothing({ target: users.email })
    .returning(publicColumns);
  if (!user) throw new EmailTakenError();
  return toCurrentUser(user);
}

/** Supprime l'utilisateur et, par cascade, toutes ses données. */
export async function deleteUser(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}
