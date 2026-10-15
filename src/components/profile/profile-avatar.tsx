"use client";

import Image from "next/image";
import { useState } from "react";

import { t } from "@/i18n/fr";

/**
 * L'icône d'invocateur du joueur (Data Dragon), avec son niveau en pastille,
 * comme dans le client du jeu. Avant la première synchronisation, ou si
 * l'image ne charge pas, l'initiale du pseudo tient la place.
 */
export function ProfileAvatar({
  gameName,
  iconUrl,
  level,
}: {
  gameName: string;
  iconUrl: string | null;
  level: number | null;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative shrink-0">
      <div className="flex size-14 items-center justify-center overflow-hidden rounded-panel border border-line-strong bg-raised display text-3xl text-ink sm:size-18 sm:text-4xl">
        {iconUrl && !failed ? (
          <Image
            src={iconUrl}
            alt=""
            width={144}
            height={144}
            unoptimized
            className="size-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <span aria-hidden>{gameName.trim().charAt(0).toUpperCase()}</span>
        )}
      </div>
      {level !== null ? (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-pill bg-canvas px-2 py-0.5 text-xs leading-none font-semibold text-ink tabular ring-1 ring-line-strong">
          <span className="sr-only">{t.dashboard.level(level)}</span>
          <span aria-hidden>{level}</span>
        </span>
      ) : null}
    </div>
  );
}
