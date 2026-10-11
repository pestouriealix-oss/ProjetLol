import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { AddRiotAccountForm } from "@/components/settings/add-riot-account-form";
import { RiotAccountList } from "@/components/settings/riot-account-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { limitsFor } from "@/lib/auth/entitlements";
import { requireUser } from "@/lib/auth/session";
import { listRiotAccounts } from "@/lib/db/riot-accounts";

import { signOutAction } from "../actions";
import { deleteAccountAction } from "./actions";

export const metadata: Metadata = { title: t.settings.title };

const copy = t.settings;

export default async function SettingsPage() {
  const user = await requireUser();
  const accounts = await listRiotAccounts(user.id);
  const maxAccounts = limitsFor(user.plan).riotAccounts;
  const canAdd = accounts.length < maxAccounts;

  return (
    <PageShell title={copy.title}>
      <Panel aria-labelledby="riot-title">
        <PanelHeader
          titleId="riot-title"
          title={copy.riot.title}
          description={copy.riot.description}
          aside={
            <p className="tabular text-sm text-ink-muted">
              {copy.riot.limit(accounts.length, maxAccounts)}
            </p>
          }
        />
        {accounts.length === 0 ? (
          <EmptyState title={copy.riot.emptyTitle} body={copy.riot.emptyBody} className="py-8" />
        ) : (
          <RiotAccountList accounts={accounts} />
        )}
        <div className="border-t border-line px-5 py-5 sm:px-6">
          <h3 className="mb-4 text-base font-semibold text-ink">{copy.riot.addTitle}</h3>
          {canAdd ? (
            <AddRiotAccountForm />
          ) : (
            <p className="text-sm text-ink-muted">{copy.riot.errors.limitReached(maxAccounts)}</p>
          )}
        </div>
      </Panel>

      <Panel aria-labelledby="account-title">
        <PanelHeader titleId="account-title" title={copy.account.title} />
        <dl className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
          <div>
            <dt className="text-sm text-ink-muted">{copy.account.email}</dt>
            <dd className="mt-1 break-all text-ink">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">{copy.account.plan}</dt>
            <dd className="mt-1">
              <Badge tone={user.plan === "PREMIUM" ? "accent" : "neutral"}>
                {t.plans[user.plan]}
              </Badge>
            </dd>
          </div>
        </dl>
        <div className="border-t border-line px-5 py-4 sm:px-6">
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              {copy.account.signOut}
            </Button>
          </form>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-5 sm:px-6">
          <div className="max-w-[58ch]">
            <h3 className="text-base font-semibold text-ink">{copy.account.dangerTitle}</h3>
            <p className="mt-1 text-sm text-ink-muted">{copy.account.dangerBody}</p>
          </div>
          <ConfirmDialog
            trigger={<Button variant="danger">{copy.account.delete}</Button>}
            title={copy.account.deleteTitle}
            body={copy.account.deleteBody}
            confirmLabel={copy.account.deleteConfirm}
            action={deleteAccountAction}
          />
        </div>
      </Panel>
    </PageShell>
  );
}
