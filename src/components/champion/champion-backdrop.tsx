"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";

import { cn } from "@/lib/cn";

/** Les images de Data Dragon passent par l'optimiseur ; un miroir de test, non. */
const DDRAGON = "https://ddragon.leagueoflegends.com/";

/**
 * L'art du champion derrière un en-tête, vu dans un cercle de vision : net au
 * centre, perdu dans le terrain sur les bords (voir `vision-mask`). Un voile
 * côté texte garde le titre lisible. Si l'image manque, rien ne s'affiche.
 */
export function ChampionBackdrop({
  src,
  className,
  focus = "72% 42%",
}: {
  src: string | null;
  className?: string;
  /** Centre du cercle de vision (« 72% 42% ») : là où se trouve le personnage. */
  focus?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (!src || failed) return null;
  const [x, y] = focus.split(" ");

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute -z-10 overflow-hidden", className)}
    >
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        unoptimized={!src.startsWith(DDRAGON)}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{ "--vision-x": x, "--vision-y": y, objectPosition: `${x} 22%` } as CSSProperties}
        className={cn(
          "vision-mask object-cover opacity-0 transition-opacity duration-(--duration-slow) ease-(--ease-out) motion-reduce:transition-none",
          loaded && "opacity-60",
        )}
      />
      {/* Voile côté texte (plus dense sur téléphone, où le texte couvre l'image), puis
          fondu vers le terrain en bas. */}
      <div className="absolute inset-0 bg-canvas/35 sm:hidden" />
      <div className="absolute inset-0 bg-linear-to-r from-canvas via-canvas/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-canvas to-transparent" />
    </div>
  );
}
