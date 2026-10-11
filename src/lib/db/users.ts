import "server-only";
import { eq } from "drizzle-orm";

import { db } from "./client";
import { users } from "./schema";

/** Les seuls champs utilisateur qui sortent de la couche de données. */
export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: "FREE" | "PREMIUM";
};

const publicColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  image: users.image,
  plan: users.plan,
};

export async function findUserById(id: string): Promise<CurrentUser | null> {
  const [user] = await db.select(publicColumns).from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
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
  return user;
}

/** Supprime l'utilisateur et, par cascade, toutes ses données. */
export async function deleteUser(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}
