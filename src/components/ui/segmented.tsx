"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

type SegmentedProps<Value extends string> = {
  /** Nom du groupe de boutons radio, unique sur la page. */
  name: string;
  legend: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  className?: string;
};

/**
 * Choix entre quelques options, avec un curseur qui glisse de l'une à l'autre.
 * Ce sont de vrais boutons radio : flèches du clavier et lecteurs d'écran
 * fonctionnent sans rien ajouter. Le curseur est positionné en CSS à partir du
 * rang de l'option choisie, sans mesurer la page.
 */
export function Segmented<Value extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  className,
}: SegmentedProps<Value>) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="pb-2 text-sm font-semibold text-ink-muted">{legend}</legend>
      <div
        className="relative grid rounded-control bg-field p-1"
        style={
          {
            gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
            "--segments": options.length,
            "--selected": selectedIndex,
          } as CSSProperties
        }
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/var(--segments))] translate-x-[calc(var(--selected)*100%)] rounded-[5px] bg-raised shadow-key transition-[translate] duration-(--duration-slow) ease-(--ease-spring)"
        />
        {options.map((option) => (
          <label key={option.value} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                // Jamais sur deux lignes : un libellé trop long se tronque.
                "block h-8 truncate rounded-[5px] px-2 text-center display text-base leading-8 tracking-[0.04em] text-ink-muted",
                "transition-[color,scale] duration-(--duration-fast) ease-(--ease-out) hover:text-ink active:scale-[0.97]",
                "peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
