"use client";

import { MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resendVerificationAction, type ResendVerificationResult } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n/fr";

const copy = t.auth.verifyBanner;

const RESULT_TEXT: Partial<Record<ResendVerificationResult, string>> = {
  sent: copy.resent,
  too_many: copy.tooMany,
  failed: copy.failed,
};

/**
 * Bandeau de l'application tant que l'adresse n'est pas confirmée : le coach
 * l'attend. Un bouton renvoie le lien.
 */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [result, setResult] = useState<ResendVerificationResult | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line-strong bg-raised px-4 py-3">
      <p className="flex items-start gap-2.5 text-ink">
        <MailCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" />
        <span>{copy.body(email)}</span>
      </p>
      <div className="flex items-center gap-3">
        {result && RESULT_TEXT[result] ? (
          <span role="status" className="text-sm text-ink-muted">
            {RESULT_TEXT[result]}
          </span>
        ) : null}
        {result !== "sent" ? (
          <Button
            size="sm"
            variant="secondary"
            pending={pending}
            onClick={() =>
              startTransition(async () => {
                const next = await resendVerificationAction();
                // Confirmée entre-temps (dans un autre onglet) : le bandeau disparaît.
                if (next === "already") router.refresh();
                else setResult(next);
              })
            }
          >
            {copy.resend}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
