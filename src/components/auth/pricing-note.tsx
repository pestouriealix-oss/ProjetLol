import { t } from "@/i18n/fr";
import { limitsFor } from "@/lib/auth/entitlements";
import { formatPremiumPrice } from "@/lib/billing/plans";

/** Le prix, dit franchement dès l'accueil : ce qui est gratuit, ce que coûte Premium. */
export function PricingNote() {
  const free = limitsFor("FREE");
  return (
    <p className="w-full max-w-xl px-1 text-sm text-ink-muted">
      {t.auth.pricing(free.draftAnalysesPerDay, free.matchReviewsPerDay, formatPremiumPrice())}
    </p>
  );
}
