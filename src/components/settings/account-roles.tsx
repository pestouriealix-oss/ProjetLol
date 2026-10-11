"use client";

import { useOptimistic, useState, useTransition } from "react";

import { updateRiotAccountRolesAction } from "@/app/(app)/settings/actions";
import { t } from "@/i18n/fr";
import type { Role } from "@/lib/config";

import { RolePicker } from "./role-picker";

type AccountRolesProps = { accountId: string; riotId: string; roles: Role[] };

/**
 * Rôles d'un compte déjà lié. Le changement s'affiche tout de suite et
 * s'enregistre en arrière-plan ; en cas d'échec, l'affichage revient à la
 * valeur enregistrée et l'erreur s'affiche.
 */
export function AccountRoles({ accountId, riotId, roles }: AccountRolesProps) {
  const [optimisticRoles, setOptimisticRoles] = useOptimistic(roles);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  const save = (next: Role[]) => {
    startTransition(async () => {
      setOptimisticRoles(next);
      setError(undefined);
      try {
        const result = await updateRiotAccountRolesAction(accountId, next);
        if (!result.ok) setError(result.error);
      } catch {
        setError(t.settings.riot.errors.unknown);
      }
    });
  };

  return (
    <RolePicker
      idPrefix={`account-${accountId}-role`}
      legend={t.settings.riot.rolesFor(riotId)}
      hideLegend
      value={optimisticRoles}
      onChange={save}
      error={error}
    />
  );
}
