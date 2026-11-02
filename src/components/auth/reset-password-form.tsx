"use client";

import { useActionState, useLayoutEffect } from "react";

import { resetPasswordAction, type ResetPasswordState } from "@/app/(auth)/actions";
import { authLinkClasses } from "@/components/auth/auth-panel";
import { Field, Input } from "@/components/ui/field";
import { Link } from "@/components/ui/link";
import { ErrorNotice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/i18n/fr";

const copy = t.auth.reset;
const initialState: ResetPasswordState = { attempt: 0 };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  // Après un refus, le curseur revient dans le champ du mot de passe.
  useLayoutEffect(() => {
    if (state.attempt > 0 && !state.expired) document.getElementById("password")?.focus();
  }, [state]);

  if (state.expired) return <ExpiredLink />;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error ? <ErrorNotice attempt={state.attempt}>{state.error}</ErrorNotice> : null}
      <input type="hidden" name="token" value={token} />
      <Field
        id="password"
        label={copy.password}
        hint={t.auth.passwordHint}
        error={state.fieldError}
        attempt={state.attempt}
      >
        {(control) => (
          <Input
            {...control}
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        )}
      </Field>
      <SubmitButton size="lg" className="mt-2">
        {copy.submit}
      </SubmitButton>
    </form>
  );
}

/** Lien expiré ou déjà utilisé : on propose d'en demander un nouveau. */
export function ExpiredLink() {
  return (
    <div className="flex flex-col items-start gap-4">
      <ErrorNotice>{copy.invalid}</ErrorNotice>
      <Link href="/forgot-password" className={authLinkClasses}>
        {copy.again}
      </Link>
    </div>
  );
}
