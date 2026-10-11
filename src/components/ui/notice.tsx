"use client";

import { CircleAlert } from "lucide-react";
import { useLayoutEffect, useRef, type ReactNode } from "react";

import { nudge } from "@/lib/motion";

import { Reveal } from "./reveal";

type ErrorNoticeProps = {
  children: ReactNode;
  /** Change à chaque envoi refusé : le message refait alors son signe de refus. */
  attempt?: number;
  className?: string;
};

/** Message d'erreur de formulaire, annoncé aux lecteurs d'écran. */
export function ErrorNotice({ children, attempt, className }: ErrorNoticeProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    // Le premier refus se signale déjà par l'apparition du message.
    if (attempt !== undefined && attempt > 1) nudge(ref.current);
  }, [attempt]);

  return (
    <Reveal className={className}>
      <p
        ref={ref}
        role="alert"
        className="flex items-start gap-2 rounded-control border border-loss/40 bg-loss-soft px-3 py-2.5 text-sm text-ink"
      >
        <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-loss" />
        <span>{children}</span>
      </p>
    </Reveal>
  );
}
