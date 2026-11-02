import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { t } from "@/i18n/fr";
import { LEGAL_UPDATED_AT } from "@/lib/config";
import { formatFullDate } from "@/lib/format";

export type LegalSection = {
  title: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
  after?: readonly string[];
};

/** En-tête d'une page légale : le titre et la date de la version. */
export function LegalHeader({ title }: { title: string }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="display text-4xl text-ink sm:text-5xl">{title}</h1>
      <p className="text-sm text-ink-faint">
        {t.legal.updated(formatFullDate(new Date(`${LEGAL_UPDATED_AT}T12:00:00Z`)))}
      </p>
    </header>
  );
}

/** Le texte d'une page légale, section par section. */
export function LegalSections({ sections }: { sections: readonly LegalSection[] }) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-3">
          <h2 className="display text-xl text-ink">{section.title}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed text-ink-muted">
              {paragraph}
            </p>
          ))}
          {section.items ? (
            <ul className="flex flex-col gap-2">
              {section.items.map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed text-ink-muted">
                  <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-ink-faint" />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          {section.after?.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed text-ink-muted">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}

/** Une information de l'éditeur, ou le signal qu'elle manque encore. */
export function PublisherValue({ value }: { value: string | null }): ReactNode {
  if (value) return value;
  return (
    <Badge tone="warn" className="h-auto min-h-6 py-1 whitespace-normal">
      {t.legal.missing}
    </Badge>
  );
}
