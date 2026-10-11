"use client";

import { useState, useTransition } from "react";

import { deleteAccountAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { t } from "@/i18n/fr";

const copy = t.settings.account;

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button variant="danger" pending={pending} onClick={() => setOpen(true)}>
        {copy.delete}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={copy.deleteTitle}
        body={copy.deleteBody}
        confirmLabel={copy.deleteConfirm}
        onConfirm={() => startTransition(() => deleteAccountAction())}
      />
    </>
  );
}
