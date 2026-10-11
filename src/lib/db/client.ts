import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/env";

import * as schema from "./schema";

// En développement, le rechargement à chaud réévalue ce module : on garde le
// pool sur `globalThis` pour ne pas ouvrir une nouvelle série de connexions à
// chaque modification.
const globalForDb = globalThis as typeof globalThis & { __dbPool?: Pool };

const pool = globalForDb.__dbPool ?? new Pool({ connectionString: env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__dbPool = pool;
}

export const db = drizzle(pool, { schema });
export type Database = typeof db;
