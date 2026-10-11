"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { t } from "@/i18n/fr";
import { signOut } from "@/lib/auth";
import { limitsFor } from "@/lib/auth/entitlements";
import { requireUser } from "@/lib/auth/session";
import {
  addRiotAccount,
  DuplicateRiotAccountError,
  removeRiotAccount,
  RiotAccountLimitError,
  setPrimaryRiotAccount,
  updateRiotAccountRoles,
} from "@/lib/db/riot-accounts";
import { deleteUser } from "@/lib/db/users";
import { addRiotAccountSchema, rolesSchema } from "@/lib/validation/riot";

const errors = t.settings.riot.errors;
const SETTINGS_PATH = "/settings";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type AddRiotAccountState = {
  /** Change à chaque succès : le formulaire s'en sert pour se vider. */
  successCount: number;
  error?: string;
  fieldErrors?: Partial<Record<"riotId" | "platform" | "roles", string>>;
  values?: { riotId: string; platform: string; roles: string[] };
};

export async function addRiotAccountAction(
  previous: AddRiotAccountState,
  formData: FormData,
): Promise<AddRiotAccountState> {
  const user = await requireUser();

  const riotId = formData.get("riotId");
  const platform = formData.get("platform");
  const values = {
    riotId: typeof riotId === "string" ? riotId : "",
    platform: typeof platform === "string" ? platform : "",
    roles: formData.getAll("roles").filter((role): role is string => typeof role === "string"),
  };
  const failure = (rest: Pick<AddRiotAccountState, "error" | "fieldErrors">) => ({
    successCount: previous.successCount,
    values,
    ...rest,
  });

  const parsed = addRiotAccountSchema.safeParse(values);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return failure({
      fieldErrors: {
        riotId: fieldErrors.riotId?.[0],
        platform: fieldErrors.platform?.[0],
        roles: fieldErrors.roles?.[0],
      },
    });
  }

  const maxAccounts = limitsFor(user.plan).riotAccounts;
  try {
    await addRiotAccount(
      user.id,
      { ...parsed.data.riotId, platform: parsed.data.platform, roles: parsed.data.roles },
      { maxAccounts },
    );
  } catch (error) {
    if (error instanceof DuplicateRiotAccountError) {
      return failure({ fieldErrors: { riotId: errors.duplicate } });
    }
    if (error instanceof RiotAccountLimitError) {
      return failure({ error: errors.limitReached(maxAccounts) });
    }
    throw error;
  }

  revalidatePath(SETTINGS_PATH);
  return { successCount: previous.successCount + 1 };
}

const accountIdSchema = z.string().min(1).max(64);

export async function updateRiotAccountRolesAction(
  accountId: string,
  roles: string[],
): Promise<ActionResult> {
  const user = await requireUser();
  const parsedId = accountIdSchema.safeParse(accountId);
  const parsedRoles = rolesSchema.safeParse(roles);
  if (!parsedId.success) return { ok: false, error: errors.notFound };
  if (!parsedRoles.success) return { ok: false, error: errors.tooManyRoles };

  const updated = await updateRiotAccountRoles(user.id, parsedId.data, parsedRoles.data);
  if (!updated) return { ok: false, error: errors.notFound };

  revalidatePath(SETTINGS_PATH);
  return { ok: true };
}

export async function setPrimaryRiotAccountAction(accountId: string): Promise<void> {
  const user = await requireUser();
  const parsedId = accountIdSchema.safeParse(accountId);
  if (parsedId.success) await setPrimaryRiotAccount(user.id, parsedId.data);
  revalidatePath(SETTINGS_PATH);
}

export async function removeRiotAccountAction(accountId: string): Promise<void> {
  const user = await requireUser();
  const parsedId = accountIdSchema.safeParse(accountId);
  if (parsedId.success) await removeRiotAccount(user.id, parsedId.data);
  revalidatePath(SETTINGS_PATH);
}

export async function deleteAccountAction(): Promise<void> {
  const user = await requireUser();
  await deleteUser(user.id);
  await signOut({ redirectTo: "/login" });
}
