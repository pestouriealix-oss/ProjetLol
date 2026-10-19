"use client";

import { Newspaper } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/cn";

/**
 * Vignette d'un article, telle que le site la publie dans son flux. Sans
 * image, ou si elle ne charge pas, une tuile neutre tient la place.
 */
export function ArticleThumb({ src, className }: { src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  const box = cn("relative block shrink-0 overflow-hidden rounded-control bg-raised", className);

  if (!src || failed) {
    return (
      <span aria-hidden className={cn(box, "grid place-items-center")}>
        <Newspaper className="size-5 text-ink-faint" />
      </span>
    );
  }
  return (
    <span aria-hidden className={box}>
      {/* Servie par le site lui-même, sans passer par nos serveurs ni lui envoyer notre adresse. */}
      <Image
        src={src}
        alt=""
        fill
        sizes="10rem"
        unoptimized
        referrerPolicy="no-referrer"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
