"use client";

import { AlertDialog } from "radix-ui";
import type { ReactNode } from "react";

import { t } from "@/i18n/fr";

import { Button } from "./button";

type ConfirmDialogProps = {
  trigger: ReactNode;
  title: string;
  body: string;
  confirmLabel: string;
  /** Action serveur exécutée à la confirmation. */
  action: () => void | Promise<void>;
};

/**
 * Demande de confirmation pour une action destructrice.
 * Le focus arrive sur « Annuler » : la touche Entrée ne détruit rien par accident.
 */
export function ConfirmDialog({ trigger, title, body, confirmLabel, action }: ConfirmDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 animate-fade-in bg-canvas/80 backdrop-blur-xs" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 animate-pop-in rounded-panel border border-line-strong bg-surface p-6">
          <AlertDialog.Title className="text-lg font-semibold text-ink">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-ink-muted">
            {body}
          </AlertDialog.Description>
          <form
            action={action}
            className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
          >
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">{t.common.cancel}</Button>
            </AlertDialog.Cancel>
            <Button type="submit" variant="danger">
              {confirmLabel}
            </Button>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
