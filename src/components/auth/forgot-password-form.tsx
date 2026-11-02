"use client";

import { useActionState } from "react";

import { forgotPasswordAction, type ForgotPasswordState } from "@/app/(auth)/actions";
import { Field, Input } from "@/components/ui/field";
import { ErrorNotice, SuccessNotice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/i18n/fr";

const copy = t.auth.forgot;
const initialState: ForgotPasswordState = { attempt: 0 };

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <p className="text-ink-muted">{copy.intro}</p>
      {state.error ? <ErrorNotice attempt={state.attempt}>{state.error}</ErrorNotice> : null}
      {state.sent ? <SuccessNotice>{copy.sent}</SuccessNotice> : null}
      <Field id="email" label={t.auth.email}>
        {(control) => (
          <Input
            {...control}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            defaultValue={state.email}
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
