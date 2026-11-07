"use client";

import Form from "next/form";
import { useActionState } from "react";

import { joinWaitlistAction, type WaitlistState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Link } from "@/components/ui/link";
import { ErrorNotice, SuccessNotice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/i18n/fr";

import { authLinkClasses } from "./auth-panel";

const copy = t.auth.invite;
const initialWaitlist: WaitlistState = { attempt: 0 };

type InviteGateProps = {
  /** Le code déjà saisi, s'il n'a pas été accepté. */
  code?: string;
  codeError?: string;
  /** D'où vient la personne (`?ref=` d'un créateur, d'une vidéo). */
  source?: string;
};

/**
 * Inscription pendant le test fermé : un code d'invitation ouvre le
 * formulaire ; sans code, on laisse son adresse sur la liste d'attente.
 */
export function InviteGate({ code, codeError, source }: InviteGateProps) {
  return (
    <>
      <p className="text-ink-muted">{copy.closedIntro}</p>
      {/* Le code part dans l'adresse (`?code=`) : la page vérifie, puis ouvre le formulaire. */}
      <Form action="/register" replace className="flex flex-col gap-4">
        <Field id="code" label={copy.code} hint={copy.codeHint} error={codeError}>
          {(control) => (
            <Input
              {...control}
              name="code"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={12}
              defaultValue={code}
              placeholder="ABCD-2345"
              className="font-semibold tracking-widest uppercase placeholder:font-normal"
              required
            />
          )}
        </Field>
        <Button type="submit" size="lg">
          {copy.useCode}
        </Button>
      </Form>
      <div className="flex items-center gap-3 text-sm text-ink-faint">
        <span aria-hidden className="h-px flex-1 bg-line" />
        {t.auth.or}
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>
      <WaitlistForm source={source} />
    </>
  );
}

function WaitlistForm({ source }: { source?: string }) {
  const [state, formAction] = useActionState(joinWaitlistAction, initialWaitlist);

  if (state.status) {
    return (
      <section aria-labelledby="waitlist-title" className="flex flex-col gap-3">
        <h2 id="waitlist-title" className="text-lg font-semibold text-ink">
          {copy.waitlistTitle}
        </h2>
        <SuccessNotice>{state.status === "added" ? copy.joined : copy.already}</SuccessNotice>
      </section>
    );
  }

  return (
    <section aria-labelledby="waitlist-title" className="flex flex-col gap-4">
      <h2 id="waitlist-title" className="text-lg font-semibold text-ink">
        {copy.waitlistTitle}
      </h2>
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {state.error ? <ErrorNotice attempt={state.attempt}>{state.error}</ErrorNotice> : null}
        {source ? <input type="hidden" name="source" value={source} /> : null}
        <Field id="waitlist-email" label={t.auth.email}>
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
        <label className="flex items-start gap-3 text-sm text-ink-muted">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-0.5 size-4 shrink-0 cursor-pointer accent-ink"
          />
          <span>
            {copy.consent}{" "}
            <Link href="/confidentialite" className={authLinkClasses}>
              {copy.privacy}
            </Link>
          </span>
        </label>
        <SubmitButton variant="secondary" size="lg">
          {copy.join}
        </SubmitButton>
      </form>
    </section>
  );
}
