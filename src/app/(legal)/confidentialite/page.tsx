import type { Metadata } from "next";

import { LegalHeader, LegalSections, PublisherValue } from "@/components/legal/legal-sections";
import { t } from "@/i18n/fr";
import { PUBLISHER } from "@/lib/config";

export const metadata: Metadata = { title: t.legal.privacy };

const notice = t.legal.noticeSections;

export default function Page() {
  return (
    <>
      <LegalHeader title={t.legal.privacy} />
      <section className="flex flex-col gap-3">
        <h2 className="display text-xl text-ink">{notice.publisher}</h2>
        <p className="leading-relaxed text-ink-muted">
          <PublisherValue value={PUBLISHER.name} />
        </p>
        <p className="leading-relaxed text-ink-muted">
          {notice.contactLabel} <PublisherValue value={PUBLISHER.email} />
        </p>
      </section>
      <LegalSections sections={t.legal.privacySections} />
    </>
  );
}
