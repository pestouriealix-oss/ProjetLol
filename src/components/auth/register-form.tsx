"use client";

import { useActionState, useLayoutEffect } from "react";

import { registerAction, type AuthField, type AuthFormState } from "@/app/(auth)/actions";
import { Field, Input } from "@/components/ui/field";
import { ErrorNotice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/i18n/fr";

const initialState: AuthFormState = { attempt: 0 };
const FIELD_ORDER: readonly AuthField[] = ["name", "email", "password"];

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);

  // Après un refus, le curseur va sur le premier champ à corriger.
  useLayoutEffect(() => {
    if (state.attempt === 0) return;
    const firstInvalid = FIELD_ORDER.find((field) => state.fieldErrors?.[field]);
    document.getElementById(firstInvalid ?? "password")?.focus();
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error ? <ErrorNotice attempt={state.attempt}>{state.error}</ErrorNotice> : null}
      <Field
        id="name"
        label={t.auth.name}
        hint={t.auth.nameHint}
        error={state.fieldErrors?.name}
        attempt={state.attempt}
      >
        {(control) => (
          <Input
            {...control}
            name="name"
            autoComplete="nickname"
            maxLength={32}
            defaultValue={state.values?.name}
          />
        )}
      </Field>
      <Field
        id="email"
        label={t.auth.email}
        error={state.fieldErrors?.email}
        attempt={state.attempt}
      >
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
      <Field
        id="password"
        label={t.auth.password}
        hint={t.auth.passwordHint}
        error={state.fieldErrors?.password}
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
        {t.auth.createAccount}
      </SubmitButton>
    </form>
  );
}
