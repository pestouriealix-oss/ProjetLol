"use client";

import { useActionState, useState } from "react";

import { addRiotAccountAction, type AddRiotAccountState } from "@/app/(app)/settings/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, Input, Select } from "@/components/ui/field";
import { ErrorNotice } from "@/components/ui/notice";
import { t } from "@/i18n/fr";
import { DEFAULT_PLATFORM, PLATFORM_IDS, PLATFORMS, ROLES, type Role } from "@/lib/config";

import { RolePicker } from "./role-picker";

const copy = t.settings.riot;
const initialState: AddRiotAccountState = { successCount: 0 };

const isRole = (value: string): value is Role => (ROLES as readonly string[]).includes(value);

export function AddRiotAccountForm() {
  const [state, formAction] = useActionState(addRiotAccountAction, initialState);

  // Après un ajout réussi, la clé change : les champs repartent de zéro.
  return <Fields key={state.successCount} state={state} formAction={formAction} />;
}

function Fields({
  state,
  formAction,
}: {
  state: AddRiotAccountState;
  formAction: (formData: FormData) => void;
}) {
  const [roles, setRoles] = useState<Role[]>(() => (state.values?.roles ?? []).filter(isRole));

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error ? <ErrorNotice>{state.error}</ErrorNotice> : null}
      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <Field
          id="riotId"
          label={copy.riotId}
          hint={copy.riotIdHint}
          error={state.fieldErrors?.riotId}
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
      </div>
      <RolePicker
        idPrefix="new-account-role"
        name="roles"
        legend={copy.roles}
        hint={copy.rolesHint}
        error={state.fieldErrors?.roles}
        value={roles}
        onChange={setRoles}
      />
      <div>
        <SubmitButton label={copy.add} pendingLabel={copy.adding} />
      </div>
    </form>
  );
}
