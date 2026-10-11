import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const databaseLayer = {
  group: ["@/lib/db/client", "drizzle-orm", "drizzle-orm/*", "pg"],
  message: "Passe par un module de src/lib/db (accès filtré par utilisateur).",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // Architecture en couches : l'interface passe par les modules de lib/,
    // jamais par le client de base de données directement.
    files: ["src/app/**", "src/components/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [databaseLayer],
          // Le lien de l'application annonce la navigation aux transitions de page.
          paths: [{ name: "next/link", message: "Utilise le lien de @/components/ui/link." }],
        },
      ],
    },
  },
  {
    // Le seul fichier autorisé à importer next/link : il l'enveloppe.
    files: ["src/components/ui/link.tsx"],
    rules: { "no-restricted-imports": ["error", { patterns: [databaseLayer] }] },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "drizzle/**"]),
]);

export default eslintConfig;
