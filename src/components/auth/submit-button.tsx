"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, "type" | "children"> & {
  label: string;
  pendingLabel: string;
};

/** Bouton d'envoi qui reflète l'état du formulaire qui le contient. */
export function SubmitButton({ label, pendingLabel, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" aria-disabled={pending} {...props}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
