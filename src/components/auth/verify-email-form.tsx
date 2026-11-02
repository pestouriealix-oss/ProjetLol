"use client";

import { useActionState } from "react";

import { confirmEmailAction, type ConfirmEmailState } from "@/app/(auth)/actions";
import { authLinkClasses } from "@/components/auth/auth-panel";
import { Link } from "@/components/ui/link";
import { ErrorNotice, SuccessNotice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/i18n/fr";

const copy = t.auth.verify;
const initialState: ConfirmEmailState = { status: "idle" };

/**
 * La confirmation demande un clic : certains logiciels de messagerie ouvrent
 * les liens d'eux-mêmes pour les inspecter, et ne doivent pas consommer le lien.
 */
export function VerifyEmailForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(confirmEmailAction, initialState);

  if (state.status === "done") {
    return (
      <div className="flex flex-col items-start gap-4">
        <SuccessNotice>{copy.done}</SuccessNotice>
        <Link href="/dashboard" className={authLinkClasses}>
          {copy.toDashboard}
        </Link>
      </div>
    );
  }
  if (state.status === "invalid") return <ErrorNotice>{copy.invalid}</ErrorNotice>;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-ink-muted">{copy.intro}</p>
      {state.status === "error" ? <ErrorNotice>{t.auth.errors.unavailable}</ErrorNotice> : null}
      <input type="hidden" name="token" value={token} />
      <SubmitButton size="lg">{copy.submit}</SubmitButton>
    </form>
  );
}
