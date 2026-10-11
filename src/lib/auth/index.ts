import "server-only";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";

import { db } from "@/lib/db/client";
import { accounts, users } from "@/lib/db/schema";
import { findUserCredentials } from "@/lib/db/users";
import { env, isDiscordEnabled } from "@/lib/env";
import { loginSchema } from "@/lib/validation/auth";

import { hashPassword, verifyPassword } from "./password";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

// Empreinte factice, vérifiée quand l'e-mail est inconnu : le temps de réponse
// ne révèle pas si un compte existe.
let decoyHash: Promise<string> | undefined;
const getDecoyHash = () => (decoyHash ??= hashPassword("decoy-password-never-matches"));

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, { usersTable: users, accountsTable: accounts }),
  // Sessions en jeton signé : nécessaire pour la connexion par mot de passe.
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await findUserCredentials(parsed.data.email);
        const valid = await verifyPassword(
          parsed.data.password,
          user?.passwordHash ?? (await getDecoyHash()),
        );
        if (!user?.passwordHash || !valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
    ...(isDiscordEnabled
      ? [Discord({ clientId: env.AUTH_DISCORD_ID, clientSecret: env.AUTH_DISCORD_SECRET })]
      : []),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
