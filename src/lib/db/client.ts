import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/env";

import * as schema from "./schema";

// En développement, le rechargement à chaud réévalue ce module : on garde le
// pool sur `globalThis` pour ne pas ouvrir une nouvelle série de connexions à
// chaque modification.
const globalForDb = globalThis as typeof globalThis & { __dbPool?: Pool };

const pool =
  globalForDb.__dbPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    // Une base injoignable doit échouer vite, pas laisser la page tourner sans fin.
    connectionTimeoutMillis: 5_000,
    // En ligne, chaque instance du serveur garde peu de connexions : l'hébergeur
    // en lance plusieurs, et la base en accepte un nombre limité.
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idleTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__dbPool = pool;
}

export const db = drizzle(pool, { schema });
export type Database = typeof db;
