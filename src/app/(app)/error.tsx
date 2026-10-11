"use client";

import { Button } from "@/components/ui/button";
import { t } from "@/i18n/fr";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 py-10">
      <h1 className="display text-4xl text-ink">{t.common.errorTitle}</h1>
      <p className="max-w-[54ch] text-lg text-ink-muted">{t.common.errorBody}</p>
      <Button variant="secondary" onClick={reset} className="mt-3">
        {t.common.retry}
      </Button>
    </div>
  );
}
