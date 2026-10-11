"use client";

import { useActionState } from "react";

import { loginAction, type AuthFormState } from "@/app/(auth)/actions";
import { Field, Input } from "@/components/ui/field";
import { ErrorNotice } from "@/components/ui/notice";
import { t } from "@/i18n/fr";

import { SubmitButton } from "./submit-button";

const initialState: AuthFormState = {};

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const error = state.error ?? initialError;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {error ? <ErrorNotice>{error}</ErrorNotice> : null}
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
      <SubmitButton
        size="lg"
        label={t.auth.signIn}
        pendingLabel={t.auth.signingIn}
        className="mt-2"
      />
    </form>
  );
}
