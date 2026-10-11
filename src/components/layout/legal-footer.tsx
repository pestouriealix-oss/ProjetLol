import Link from "next/link";

import { t } from "@/i18n/fr";
import { RIOT_DISCLAIMER } from "@/lib/config";
import { cn } from "@/lib/cn";

/** Pied de page : liens légaux et mention exigée par Riot Games. */
export function LegalFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-line text-xs text-ink-faint", className)}>
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 sm:px-6">
        <nav aria-label="Informations légales" className="flex gap-4">
          <Link href="/cgu" className="underline-offset-4 hover:text-ink-muted hover:underline">
            {t.legal.terms}
          </Link>
          <Link
            href="/confidentialite"
            className="underline-offset-4 hover:text-ink-muted hover:underline"
          >
            {t.legal.privacy}
          </Link>
        </nav>
        <p lang="en" className="max-w-[90ch]">
          {RIOT_DISCLAIMER}
        </p>
      </div>
    </footer>
  );
}
