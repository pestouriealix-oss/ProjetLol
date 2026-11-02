import type { Metadata } from "next";

import { LegalHeader, LegalSections } from "@/components/legal/legal-sections";
import { t } from "@/i18n/fr";
import { limitsFor } from "@/lib/auth/entitlements";
import { formatPremiumPrice } from "@/lib/billing/plans";
import { PUBLISHER } from "@/lib/config";

export const metadata: Metadata = { title: t.legal.terms };

export default function Page() {
  const free = limitsFor("FREE");
  const sections = t.legal.termsSections({
    sheets: free.draftAnalysesPerDay,
    reviews: free.matchReviewsPerDay,
    price: formatPremiumPrice(),
  });
  return (
    <>
      <LegalHeader title={t.legal.terms} />
      <LegalSections sections={sections} />
      {PUBLISHER.email ? (
        <p className="text-ink-muted">{t.legal.contactLine(PUBLISHER.email)}</p>
      ) : null}
    </>
  );
}
