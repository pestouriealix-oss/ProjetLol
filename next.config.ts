import type { NextConfig } from "next";

/** En-têtes de sécurité envoyés avec chaque page. */
const SECURITY_HEADERS = [
  // Le site ne s'affiche pas dans le cadre d'un autre site (protection contre le clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HTTPS obligatoire pendant deux ans une fois le site visité (ignoré en local, en HTTP).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
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
