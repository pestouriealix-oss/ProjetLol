import type { ReactNode } from "react";

import { HowItWorks } from "@/components/auth/how-it-works";
import { Wordmark } from "@/components/brand/wordmark";
import { Entrance } from "@/components/layout/entrance";
import { LegalFooter } from "@/components/layout/legal-footer";
import { t } from "@/i18n/fr";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Entrance className="flex min-h-dvh flex-col">
      {/* Entre 1024 et 1280 px, la colonne de gauche se resserre pour laisser au
          parcours sa pleine largeur. */}
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-x-12 gap-y-14 px-4 pt-8 pb-16 group-data-entering/shell:shell-rise sm:px-6 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:pt-12 xl:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] xl:gap-x-24">
        <main id="contenu" className="flex flex-col">
          <Wordmark />
          <p className="mt-12 display text-5xl text-balance text-ink lg:mt-16 lg:text-4xl xl:text-5xl">
            {t.auth.headline}
          </p>
          <p className="mt-5 max-w-[42ch] text-lg text-ink-muted">{t.auth.pitch}</p>
          <div className="mt-10">{children}</div>
        </main>
        <aside className="flex justify-center lg:sticky lg:top-10 lg:justify-end">
          <HowItWorks />
        </aside>
      </div>
      <LegalFooter />
    </Entrance>
  );
}
