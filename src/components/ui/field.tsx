import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

const controlClasses = cn(
  "h-10 w-full rounded-control border border-line-strong bg-canvas px-3 text-base text-ink sm:text-sm",
  "transition-colors duration-(--duration-fast) placeholder:text-ink-faint",
  "hover:border-ink-faint focus-visible:border-accent focus-visible:outline-offset-0",
  "disabled:opacity-50 aria-invalid:border-loss",
);

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClasses, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(controlClasses, "appearance-none pr-9", className)} {...props} />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
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
export function Field({ id, label, hint, error, children, className }: FieldProps) {
  const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children({ id, "aria-describedby": messageId, "aria-invalid": error ? true : undefined })}
      {error ? (
        <p id={messageId} className="text-sm text-loss">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-sm text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
