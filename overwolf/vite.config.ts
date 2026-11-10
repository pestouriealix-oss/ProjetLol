import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/**
 * L'app Overwolf : trois fenêtres (une cachée, une de bureau, une à l'écran
 * de chargement), chacune une page HTML. Elle réutilise le code du site
 * (`@/…` → `../src`) qui ne dépend pas de Next.js : textes, schémas, fiche.
 * React, Zod et les composants viennent des dépendances du site (dossier
 * parent) : une seule copie de chaque, pour le site comme pour l'app.
 */
export default defineConfig({
  // Overwolf charge les fichiers depuis le disque : chemins relatifs.
  base: "./",
  plugins: [react(), tailwindcss()],
  // Le banc d'essai lit aussi les fichiers du site (polices, composants).
  server: { fs: { allow: [here("..")] } },
  resolve: {
    alias: {
      "@": here("../src"),
      // Le portrait de champion du site passe par `next/image` : ici, une simple <img>.
      "next/image": here("./src/shims/next-image.tsx"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Pas de chargement à la demande : tout est sur le disque de toute façon.
    modulePreload: false,
    rollupOptions: {
      input: {
        background: here("./background.html"),
        desktop: here("./desktop.html"),
        in_game: here("./in_game.html"),
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
