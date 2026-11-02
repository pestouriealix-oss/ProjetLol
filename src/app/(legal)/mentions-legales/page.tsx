import type { Metadata } from "next";
import type { ReactNode } from "react";

import { LegalHeader, PublisherValue } from "@/components/legal/legal-sections";
import { t } from "@/i18n/fr";
import { PUBLISHER, RIOT_DISCLAIMER } from "@/lib/config";

export const metadata: Metadata = { title: t.legal.notice };

const copy = t.legal.noticeSections;

function Entry({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="display text-xl text-ink">{title}</h2>
      <div className="leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <>
      <LegalHeader title={t.legal.notice} />
      <div className="flex flex-col gap-8">
        <Entry title={copy.publisher}>
          <p>
            <PublisherValue value={PUBLISHER.name} />
          </p>
          <p>
            <PublisherValue value={PUBLISHER.status} />
          </p>
        </Entry>
        <Entry title={copy.director}>
          <PublisherValue value={PUBLISHER.name} />
        </Entry>
        <Entry title={copy.contact}>
          <PublisherValue value={PUBLISHER.email} />
        </Entry>
        <Entry title={copy.host}>{copy.hostBody}</Entry>
        <Entry title={copy.riot}>
          <p lang="en">{RIOT_DISCLAIMER}</p>
        </Entry>
      </div>
    </>
  );
}
