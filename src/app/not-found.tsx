import Link from "next/link";

import { Button } from "@/components/ui/button";
import { t } from "@/i18n/fr";

export default function NotFound() {
  return (
    <main
      id="contenu"
      className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4"
    >
      <p className="tabular text-sm text-ink-faint">404</p>
      <h1 className="text-3xl font-semibold">{t.common.notFoundTitle}</h1>
      <p className="text-ink-muted">{t.common.notFoundBody}</p>
      <div>
        <Button asChild variant="secondary">
          <Link href="/dashboard">{t.common.backHome}</Link>
        </Button>
      </div>
    </main>
  );
}
