"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "./button";

/**
 * Bouton d'envoi qui reflète l'état du formulaire qui le contient : pendant
 * l'envoi, le signal d'attente apparaît et les clics sont ignorés. Le libellé
 * ne change pas, pour que le bouton garde sa largeur.
 */
export function SubmitButton(props: Omit<ComponentProps<typeof Button>, "type" | "pending">) {
  const { pending } = useFormStatus();
  return <Button type="submit" pending={pending} {...props} />;
}
