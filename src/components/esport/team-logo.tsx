"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Logo d'une équipe ou d'une ligue (fourni par PandaScore), décoratif : le nom
 * est toujours écrit à côté. Sans logo, ou s'il ne charge pas, une tuile
 * neutre (ou `fallback`) tient la place, sans répéter le nom.
 */
export function TeamLogo({
  src,
  className,
  fallback,
}: {
  src: string | null;
  className?: string;
  fallback?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const box = cn("flex size-7 shrink-0 items-center justify-center overflow-hidden", className);
  if (!src || failed) {
    return (
      <span aria-hidden className={cn(box, "rounded-[5px] bg-raised text-ink-faint")}>
        {fallback}
      </span>
    );
  }
  return (
    <span aria-hidden className={box}>
      <Image
        src={src}
        alt=""
        width={64}
        height={64}
        unoptimized
        className="size-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
