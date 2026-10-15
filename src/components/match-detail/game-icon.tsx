"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/cn";

/**
 * Petite image du jeu (objet, sort, rune), servie par Data Dragon. Un
 * emplacement vide, une image absente ou qui ne charge pas laissent une case
 * vide de la même taille : la rangée ne bouge pas.
 */
export function GameIcon({
  src,
  label,
  className,
  round = false,
}: {
  src: string | null;
  /** Nom de l'objet, du sort ou de la rune : lu par les lecteurs d'écran et affiché au survol. */
  label: string;
  className?: string;
  round?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const box = cn(
    "size-6 shrink-0 overflow-hidden bg-field",
    round ? "rounded-full" : "rounded-[5px]",
    className,
  );

  if (!src || failed) {
    return (
      <span role="img" aria-label={label} title={label} className={cn(box, "border border-line")} />
    );
  }
  return (
    <span className={box} title={label}>
      {/* Servie telle quelle par Riot : déjà petite, inutile de la retraiter. */}
      <Image
        src={src}
        alt={label}
        width={64}
        height={64}
        unoptimized
        className="size-full object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
