import type { ReactNode } from "react";

import { SampleSheet } from "@/components/draft/sample-sheet";
import { LegalFooter } from "@/components/layout/legal-footer";
import { Wordmark } from "@/components/layout/wordmark";
import { t } from "@/i18n/fr";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-x-16 gap-y-12 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,26rem)_1fr] lg:py-14">
        <main id="contenu" className="flex flex-col">
          <Wordmark />
          <div className="mt-10 lg:mt-16">
            <p className="font-display text-3xl leading-tight font-semibold text-ink">
              {t.auth.headline}
            </p>
            <p className="mt-3 max-w-[46ch] text-ink-muted">{t.auth.pitch}</p>
          </div>
          <div className="mt-10">{children}</div>
        </main>
        <aside className="flex items-start justify-center lg:items-center lg:justify-end">
          <SampleSheet />
        </aside>
      </div>
      <LegalFooter />
    </div>
  );
}
