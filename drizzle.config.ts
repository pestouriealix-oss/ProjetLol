import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// En ligne, les migrations passent de préférence par la connexion directe
// (sans le pool de Neon, qui ne garde pas une session ouverte).
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL est requise pour les migrations (voir .env.example).");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
});
