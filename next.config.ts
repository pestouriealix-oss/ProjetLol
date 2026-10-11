import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Portraits des champions : uniquement depuis Data Dragon (règle Riot).
    remotePatterns: [{ protocol: "https", hostname: "ddragon.leagueoflegends.com" }],
  },
  // Toutes les pages dépendent de l'utilisateur connecté : elles sont rendues à
  // chaque requête. `cacheComponents` (coquille statique + contenu en flux)
  // pourra être activé plus tard, page par page, quand il y aura des données
  // lourdes à mettre en cache.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
