"use client";

import { useActionState, useLayoutEffect, useState } from "react";

import { addRiotAccountAction, type AddRiotAccountState } from "@/app/(app)/settings/actions";
import { Field, Input, Select } from "@/components/ui/field";
import { ErrorNotice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/i18n/fr";
import { DEFAULT_PLATFORM, PLATFORM_IDS, PLATFORMS, ROLES, type Role } from "@/lib/config";

import { RolePicker } from "./role-picker";

const copy = t.settings.riot;
const initialState: AddRiotAccountState = { successCount: 0, attempt: 0 };

const isRole = (value: string): value is Role => (ROLES as readonly string[]).includes(value);

export function AddRiotAccountForm({
  secondary = false,
}: {
  /** Vrai quand « Se connecter avec Riot » est proposé au-dessus : l'ajout par Riot ID passe au second plan. */
  secondary?: boolean;
}) {
  const [state, formAction] = useActionState(addRiotAccountAction, initialState);

  // Après un ajout réussi, la clé change : les champs repartent de zéro.
  return (
    <Fields key={state.successCount} state={state} formAction={formAction} secondary={secondary} />
  );
}

function Fields({
  state,
  formAction,
  secondary,
}: {
  state: AddRiotAccountState;
  formAction: (formData: FormData) => void;
  secondary: boolean;
}) {
  const [roles, setRoles] = useState<Role[]>(() => (state.values?.roles ?? []).filter(isRole));

  // Après un refus, le curseur revient sur le Riot ID, presque toujours en cause.
  useLayoutEffect(() => {
    if (state.attempt > 0) document.getElementById("riotId")?.focus();
  }, [state.attempt]);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error ? <ErrorNotice attempt={state.attempt}>{state.error}</ErrorNotice> : null}
      <Field
        id="riotId"
        label={copy.riotId}
        hint={copy.riotIdHint}
        error={state.fieldErrors?.riotId}
        attempt={state.attempt}
      >
        {(control) => (
          <Input
            {...control}
            name="riotId"
            placeholder={copy.riotIdPlaceholder}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={24}
            defaultValue={state.values?.riotId}
            required
          />
        )}
      </Field>
      <Field id="platform" label={copy.platform} error={state.fieldErrors?.platform}>
        {(control) => (
          <Select
            {...control}
            name="platform"
            defaultValue={state.values?.platform || DEFAULT_PLATFORM}
          >
            {PLATFORM_IDS.map((platform) => (
              <option key={platform} value={platform}>
                {PLATFORMS[platform].label} ({PLATFORMS[platform].short})
              </option>
            ))}
          </Select>
        )}
      </Field>
      <RolePicker
        idPrefix="new-account-role"
        name="roles"
        legend={copy.roles}
        hint={copy.rolesHint}
        error={state.fieldErrors?.roles}
        value={roles}
        onChange={setRoles}
      />
      <SubmitButton variant={secondary ? "secondary" : "solid"} className="mt-1 self-start">
        {copy.add}
      </SubmitButton>
    </form>
  );
}
