"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/cn";

/**
 * Portrait d'un champion (Data Dragon). Sans image disponible, ou si elle ne
 * charge pas, une tuile avec l'initiale tient la place.
 */
export function ChampionIcon({
  name,
  src,
  className,
}: {
  name: string;
  src: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const box = cn("size-10 shrink-0 overflow-hidden rounded-control bg-raised", className);

  if (!src || failed) {
    return (
      <span aria-hidden className={cn(box, "flex items-center justify-center display text-xl")}>
        {name.charAt(0)}
      </span>
    );
  }
  return (
    <span className={box}>
      {/* Servie telle quelle par Riot : déjà petite, inutile de la retraiter. */}
      <Image
        src={src}
        alt=""
        width={80}
        height={80}
        unoptimized
        className="size-full scale-110 object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
