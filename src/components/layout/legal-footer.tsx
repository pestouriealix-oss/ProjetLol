import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import { RIOT_DISCLAIMER } from "@/lib/config";
import { cn } from "@/lib/cn";

const linkClasses =
  "underline-offset-4 transition-colors duration-(--duration-fast) hover:text-ink hover:underline";

/** Pied de page : liens légaux et mention exigée par Riot Games. */
export function LegalFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-line/70 text-xs text-ink-faint", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:px-6">
        <nav aria-label={t.legal.navLabel} className="flex gap-5">
          <Link href="/cgu" className={linkClasses}>
            {t.legal.terms}
          </Link>
          <Link href="/confidentialite" className={linkClasses}>
            {t.legal.privacy}
          </Link>
        </nav>
        <p lang="en" className="max-w-[92ch]">
          {RIOT_DISCLAIMER}
        </p>
      </div>
    </footer>
  );
}
