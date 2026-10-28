import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

import { Ping } from "./ping";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-control display whitespace-nowrap select-none",
    // La couleur change vite ; l'échelle revient comme un ressort après la pression.
    "[transition:scale_var(--duration-slow)_var(--ease-spring),background-color_var(--duration-fast)_var(--ease-out),border-color_var(--duration-fast)_var(--ease-out),color_var(--duration-fast)_var(--ease-out),opacity_var(--duration-fast)_var(--ease-out)]",
    "active:scale-[0.96] active:[transition-duration:var(--duration-press)]",
    "disabled:pointer-events-none aria-disabled:pointer-events-none aria-disabled:opacity-60",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      /**
       * Quatre niveaux, du plus fort au plus discret :
       * - `coach` : le corail, réservé à ce que le coach fait faire (nouvelle
       *   game, écrire la fiche, écrire le bilan). Jamais ailleurs.
       * - `solid` : la craie pleine, l'action principale d'une page qui n'est
       *   pas le coach (se connecter, lier son compte, passer Premium).
       * - `secondary` : le contour, une action à côté de la principale.
       * - `ghost` : le texte seul, une action discrète.
       * Désactivé, un bouton plein devient une surface neutre : un corail
       * ou une craie éteints se liraient comme une erreur.
       */
      variant: {
        coach:
          "bg-accent text-on-accent shadow-key hover:bg-accent-hover disabled:bg-raised disabled:text-ink-faint disabled:shadow-none",
        solid:
          "bg-ink text-canvas shadow-key hover:bg-ink-muted disabled:bg-raised disabled:text-ink-faint disabled:shadow-none",
        secondary:
          "border border-line-strong bg-raised text-ink hover:border-ink-faint hover:bg-line disabled:border-line disabled:text-ink-faint",
        ghost: "text-ink-muted hover:bg-raised hover:text-ink disabled:text-ink-faint",
        danger:
          "border border-loss/50 text-loss hover:border-loss hover:bg-loss-soft disabled:opacity-50",
      },
      size: {
        sm: "h-8 px-3 text-base tracking-[0.045em]",
        md: "h-10 px-4 text-lg tracking-[0.04em]",
        lg: "h-12 px-6 text-xl tracking-[0.035em]",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Rend l'enfant (un lien, par exemple) avec l'apparence du bouton. */
    asChild?: boolean;
    /** Action en cours : affiche le signal d'attente et bloque les nouveaux clics. */
    pending?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  pending = false,
  type,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      type={type ?? "button"}
      className={classes}
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      {...props}
      // Un bouton en attente reste focalisable (le focus ne saute pas), mais n'agit plus.
      onClick={pending ? (event) => event.preventDefault() : props.onClick}
    >
      {/* Le signal se fait une place en poussant le libellé, sans à-coup. */}
      <span
        className={cn(
          "grid transition-[grid-template-columns,opacity,margin] duration-(--duration-base) ease-(--ease-out)",
          pending ? "grid-cols-[1fr] opacity-100" : "-mr-2 grid-cols-[0fr] opacity-0",
        )}
      >
        <span className="flex min-w-0 items-center overflow-hidden">
          <Ping />
        </span>
      </span>
      {children}
    </button>
  );
}
