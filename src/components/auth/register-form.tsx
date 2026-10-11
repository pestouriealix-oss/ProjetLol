"use client";

import { useActionState } from "react";

import { registerAction, type AuthFormState } from "@/app/(auth)/actions";
import { Field, Input } from "@/components/ui/field";
import { ErrorNotice } from "@/components/ui/notice";
import { t } from "@/i18n/fr";

import { SubmitButton } from "./submit-button";

const initialState: AuthFormState = {};

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error ? <ErrorNotice>{state.error}</ErrorNotice> : null}
      <Field id="name" label={t.auth.name} hint={t.auth.nameHint} error={state.fieldErrors?.name}>
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
      <Field id="email" label={t.auth.email} error={state.fieldErrors?.email}>
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
      <SubmitButton
        size="lg"
        label={t.auth.createAccount}
        pendingLabel={t.auth.creatingAccount}
        className="mt-2"
      />
    </form>
  );
}
