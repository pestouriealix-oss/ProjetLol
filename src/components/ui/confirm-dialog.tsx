"use client";

import { AlertDialog } from "radix-ui";
import { useRef } from "react";

import { t } from "@/i18n/fr";

import { Button } from "./button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  confirmLabel: string;
  /**
   * Appelé après confirmation, une fois la fenêtre refermée : ce qui se passe
   * ensuite sur la page (une ligne qui s'efface, par exemple) se joue à
   * découvert, pas sous la fenêtre en train de partir. Le focus n'est pas
   * rendu au déclencheur ; c'est à l'appelant de le placer.
   */
  onConfirm: () => void;
};

/**
 * Demande de confirmation pour une action destructrice.
 * Le focus arrive sur « Annuler » : la touche Entrée ne détruit rien par accident.
 * La fenêtre arrive avec un léger ressort et repart vite, sans attendre.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  onConfirm,
}: ConfirmDialogProps) {
  const confirmed = useRef(false);

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-field/75 backdrop-blur-[3px] data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in" />
        <AlertDialog.Content
          className="fixed inset-0 z-50 m-auto h-fit w-[calc(100vw-2rem)] max-w-md rounded-panel border border-line-strong bg-surface p-6 shadow-lift data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in"
          onCloseAutoFocus={(event) => {
            if (!confirmed.current) return;
            confirmed.current = false;
            event.preventDefault();
            onConfirm();
          }}
        >
          <AlertDialog.Title className="display text-2xl text-ink">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-3 text-ink-muted">{body}</AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">{t.common.cancel}</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant="danger"
                onClick={() => {
                  confirmed.current = true;
                }}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
