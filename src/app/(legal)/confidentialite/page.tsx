import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { t } from "@/i18n/fr";

export const metadata: Metadata = { title: t.legal.privacy };

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-semibold">{t.legal.privacy}</h1>
      <div>
        <Badge tone="warn">{t.legal.draftNotice}</Badge>
      </div>
      <p className="text-ink-muted">{t.legal.privacyBody}</p>
    </>
  );
}
