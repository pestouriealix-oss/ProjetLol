import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { atkinsonNext, sofiaSansXC } from "@/app/fonts";
import { HydrationMark } from "@/components/layout/entrance";
import { t } from "@/i18n/fr";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: t.auth.pitch,
};

export const viewport: Viewport = {
  // Couleur du terrain (--color-canvas), en hexadécimal pour la barre du navigateur.
  themeColor: "#051913",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${sofiaSansXC.variable} ${atkinsonNext.variable}`}>
      <body>
        <a
          href="#contenu"
          className="sr-only display focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:rounded-control focus-visible:bg-accent focus-visible:px-3 focus-visible:py-2 focus-visible:text-lg focus-visible:text-on-accent"
        >
          {t.common.skipToContent}
        </a>
        {children}
        <HydrationMark />
      </body>
    </html>
  );
}
