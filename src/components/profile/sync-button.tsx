"use client";

import { RefreshCw } from "lucide-react";
import { useActionState } from "react";

import { syncAccountAction, type SyncState } from "@/app/(app)/dashboard/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";

const copy = t.dashboard.sync;
const idle: SyncState = { status: "idle" };

/**
 * Bouton « Mettre à jour » d'un compte. Le résultat s'affiche à côté : ce qui
 * est arrivé, ou pourquoi rien n'est arrivé. `lastSynced` est déjà mis en
 * forme par le serveur.
 */
export function SyncButton({ accountId, lastSynced }: { accountId: string; lastSynced: string }) {
  const [state, formAction] = useActionState(() => syncAccountAction(accountId), idle);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <SubmitButton variant="secondary">
        <RefreshCw aria-hidden />
        {copy.action}
      </SubmitButton>
      <p
        aria-live="polite"
        className={cn(
          "max-w-[34ch] text-sm",
          state.status === "failed" ? "text-loss" : "text-ink-muted",
        )}
      >
        {state.status === "idle" ? lastSynced : state.message}
      </p>
    </form>
  );
}
