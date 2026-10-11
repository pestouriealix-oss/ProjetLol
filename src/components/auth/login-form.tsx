"use client";

import { useActionState, useLayoutEffect } from "react";

import { loginAction, type AuthFormState } from "@/app/(auth)/actions";
import { Field, Input } from "@/components/ui/field";
import { ErrorNotice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/i18n/fr";

const initialState: AuthFormState = { attempt: 0 };

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const error = state.error ?? initialError;

  // Après un refus, le mot de passe a été vidé : on y replace le curseur.
  useLayoutEffect(() => {
    if (state.attempt > 0) document.getElementById("password")?.focus();
  }, [state.attempt]);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {error ? <ErrorNotice attempt={state.attempt}>{error}</ErrorNotice> : null}
      <Field id="email" label={t.auth.email}>
        {(control) => (
          <Input
            {...control}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            defaultValue={state.values?.email}
            required
          />
        )}
      </Field>
      <Field id="password" label={t.auth.password}>
        {(control) => (
          <Input
            {...control}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        )}
      </Field>
      <SubmitButton size="lg" className="mt-2">
        {t.auth.signIn}
      </SubmitButton>
    </form>
  );
}
