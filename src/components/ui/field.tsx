"use client";

import { ChevronDown } from "lucide-react";
import { useLayoutEffect, useRef, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { nudge } from "@/lib/motion";

import { Reveal } from "./reveal";

const controlClasses = cn(
  "h-11 w-full rounded-control border border-line-strong bg-field px-3 text-base text-ink",
  "placeholder:text-ink-faint",
  "transition-[border-color,box-shadow] duration-(--duration-fast) ease-(--ease-out)",
  "hover:border-ink-faint",
  // Le focus se lit sur la bordure et un halo, plutôt que sur un contour décollé.
  "focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)] focus-visible:outline-none",
  "aria-invalid:border-loss aria-invalid:focus-visible:shadow-[0_0_0_3px_var(--color-loss-soft)]",
  "disabled:opacity-50",
);

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClasses, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <div className="group relative">
      <select className={cn(controlClasses, "appearance-none pr-9", className)} {...props} />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted transition-[translate,color] duration-(--duration-fast) ease-(--ease-out) group-focus-within:translate-y-[-35%] group-focus-within:text-accent"
      />
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /**
   * Change à chaque envoi refusé. Le champ refait alors son signe de refus,
   * même si le message d'erreur est resté le même.
   */
  attempt?: number;
  /** Reçoit les attributs d'accessibilité à poser sur le contrôle. */
  children: (control: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": boolean | undefined;
  }) => ReactNode;
  className?: string;
};

/**
 * Libellé + contrôle + aide + erreur, reliés pour les lecteurs d'écran.
 * L'erreur remplace l'aide : un seul message sous le champ à la fois.
 */
export function Field({ id, label, hint, error, attempt, children, className }: FieldProps) {
  const controlRef = useRef<HTMLDivElement>(null);

  // Effet « layout » : le signe de refus part avec l'affichage de l'erreur,
  // même quand React fait suivre le rendu d'une transition de vue (les effets
  // ordinaires attendent alors la fin de la transition).
  useLayoutEffect(() => {
    if (error) nudge(controlRef.current);
  }, [error, attempt]);

  const message = error ?? hint;
  const messageId = message ? `${id}-${error ? "error" : "hint"}` : undefined;
  const messageNode = message ? (
    <p
      id={messageId}
      className={cn(
        "pt-1.5 text-sm transition-colors duration-(--duration-fast)",
        error ? "text-loss" : "text-ink-faint",
      )}
    >
      {message}
    </p>
  ) : null;

  return (
    <div className={cn("flex flex-col", className)}>
      <label htmlFor={id} className="pb-1.5 text-sm font-semibold text-ink">
        {label}
      </label>
      <div ref={controlRef}>
        {children({ id, "aria-describedby": messageId, "aria-invalid": error ? true : undefined })}
      </div>
      {/* Avec une aide, l'erreur prend sa place sans bouger la mise en page.
          Sans aide, elle doit se faire une place : on l'ouvre en douceur. */}
      {hint ? messageNode : messageNode ? <Reveal>{messageNode}</Reveal> : null}
    </div>
  );
}
