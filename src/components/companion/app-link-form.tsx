"use client";

import { ShieldAlert } from "lucide-react";
import { useActionState } from "react";

import { approveAppLinkAction, type AppLinkState } from "@/app/(auth)/app/actions";
import { Field, Input } from "@/components/ui/field";
import { ErrorNotice, SuccessNotice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/i18n/fr";

const copy = t.companion.link;
const initialState: AppLinkState = { attempt: 0 };

/** Validation du code de l'app : un champ, un avertissement, un bouton. */
export function AppLinkForm({
  initialCode,
  signedInAs,
}: {
  initialCode: string;
  signedInAs: string;
}) {
  const [state, formAction] = useActionState(approveAppLinkAction, initialState);

  if (state.status === "approved") {
    return (
      <div role="status" className="flex flex-col gap-2">
        <SuccessNotice>
          <span className="font-semibold">{copy.approvedTitle}</span>. {copy.approvedBody}
        </SuccessNotice>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error ? <ErrorNotice attempt={state.attempt}>{state.error}</ErrorNotice> : null}
      <p className="text-sm text-ink-faint">{signedInAs}</p>
      <Field id="code" label={copy.code} hint={copy.codeHint}>
        {(control) => (
          <Input
            {...control}
            name="code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            defaultValue={state.code ?? initialCode}
            placeholder="ABCD-2345"
            className="font-semibold tracking-widest uppercase placeholder:font-normal"
            required
          />
        )}
      </Field>
      <p className="flex items-start gap-2.5 text-sm text-ink-muted">
        <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-faint" />
        {copy.warning}
      </p>
      <SubmitButton size="lg">{copy.approve}</SubmitButton>
    </form>
  );
}
