import "server-only";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type DefaultSession } from "next-auth";
import { cookies } from "next/headers";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { z } from "zod";

import { db } from "@/lib/db/client";
import { accounts, users } from "@/lib/db/schema";
import {
  attachInviteToUser,
  consumeInvite,
  findInviteId,
  hasLinkedAccount,
} from "@/lib/db/invites";
import { findUserCredentials, findUserIdByEmail, markEmailVerified } from "@/lib/db/users";
import { env, isDiscordEnabled, isInviteOnly } from "@/lib/env";
import { loginSchema } from "@/lib/validation/auth";

import { INVITE_COOKIE } from "./invite-cookie";
import { normalizeInviteCode } from "./invite-code";
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
    /**
     * Test fermé : un nouveau compte Discord n'est créé qu'avec un code
     * d'invitation, déposé dans un cookie par la page d'inscription juste
     * avant de partir chez Discord. La place est prise ici, d'un seul coup ;
     * un compte Discord déjà lié se connecte sans code. Une adresse qui a déjà
     * un compte passe aussi : Auth.js refuse alors de lier les deux (et le code
     * n'est pas gâché).
     */
    async signIn({ account, user }) {
      if (account?.provider !== "discord" || !isInviteOnly) return true;
      if (await hasLinkedAccount("discord", account.providerAccountId)) return true;
      if (user.email && (await findUserIdByEmail(user.email.toLowerCase()))) return true;
      const code = normalizeInviteCode((await cookies()).get(INVITE_COOKIE)?.value ?? "");
      if (code && (await consumeInvite(code))) return true;
      return "/register?invitation=requise";
    },
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
    /** Un compte créé via Discord garde la trace du code qui l'a ouvert. */
    async createUser({ user }) {
      if (!isInviteOnly || !user.id) return;
      const code = normalizeInviteCode((await cookies()).get(INVITE_COOKIE)?.value ?? "");
      const inviteId = code ? await findInviteId(code) : null;
      if (inviteId) await attachInviteToUser(user.id, inviteId);
    },
    // Un compte Discord dont l'adresse est vérifiée chez Discord n'a pas à la reconfirmer.
    async signIn({ user, account, profile }) {
      if (account?.provider !== "discord" || !user.id || !user.email) return;
      if (discordProfileSchema.safeParse(profile).data?.verified) {
        await markEmailVerified(user.id, user.email);
      }
    },
  },
});
