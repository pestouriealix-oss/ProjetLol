import "server-only";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { z } from "zod";

import { db } from "@/lib/db/client";
import { accounts, users } from "@/lib/db/schema";
import { findUserCredentials, markEmailVerified } from "@/lib/db/users";
import { env, isDiscordEnabled } from "@/lib/env";
import { loginSchema } from "@/lib/validation/auth";

import { hashPassword, verifyPassword } from "./password";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
    /** Moment de la connexion (ms) : une session ouverte avant un changement de mot de passe ne vaut plus. */
    authAt?: number;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    authAt?: number;
  }
}

/** Le profil Discord dit si l'adresse e-mail a été vérifiée chez eux. */
const discordProfileSchema = z.object({ verified: z.boolean() });

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
      // `user` n'est présent qu'à la connexion : on date la session à ce moment-là.
      if (user?.id) {
        token.sub = user.id;
        token.authAt = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.authAt = token.authAt;
      return session;
    },
  },
  events: {
    // Un compte Discord dont l'adresse est vérifiée chez Discord n'a pas à la reconfirmer.
    async signIn({ user, account, profile }) {
      if (account?.provider !== "discord" || !user.id || !user.email) return;
      if (discordProfileSchema.safeParse(profile).data?.verified) {
        await markEmailVerified(user.id, user.email);
      }
    },
  },
});
