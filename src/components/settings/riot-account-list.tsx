import { Trash2 } from "lucide-react";

import { removeRiotAccountAction, setPrimaryRiotAccountAction } from "@/app/(app)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { t } from "@/i18n/fr";
import { PLATFORMS } from "@/lib/config";
import type { RiotAccount } from "@/lib/db/schema";
import { formatRiotId } from "@/lib/validation/riot";

import { AccountRoles } from "./account-roles";

const copy = t.settings.riot;

export function RiotAccountList({ accounts }: { accounts: RiotAccount[] }) {
  return (
    <ul className="divide-y divide-line">
      {accounts.map((account) => {
        const riotId = formatRiotId(account);
        return (
          <li key={account.id} className="flex flex-col gap-3 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="min-w-0 font-display text-lg font-semibold break-words text-ink">
                {account.gameName}
                <span className="font-normal text-ink-faint">#{account.tagLine}</span>
              </p>
              <Badge>{PLATFORMS[account.platform].short}</Badge>
              {account.isPrimary ? <Badge tone="accent">{copy.primary}</Badge> : null}
              {account.verifiedAt ? null : (
                <Badge tone="warn" title={copy.unverifiedHint}>
                  {copy.unverified}
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-1">
                {account.isPrimary ? null : (
                  <form action={setPrimaryRiotAccountAction.bind(null, account.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      {copy.makePrimary}
                    </Button>
                  </form>
                )}
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon" aria-label={copy.removeLabel(riotId)}>
                      <Trash2 aria-hidden />
                    </Button>
                  }
                  title={copy.removeTitle(riotId)}
                  body={copy.removeBody}
                  confirmLabel={copy.removeConfirm}
                  action={removeRiotAccountAction.bind(null, account.id)}
                />
              </div>
            </div>
            <AccountRoles accountId={account.id} riotId={riotId} roles={account.roles} />
          </li>
        );
      })}
    </ul>
  );
}
