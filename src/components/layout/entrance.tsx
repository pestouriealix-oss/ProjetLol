"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Vrai une fois la première page affichée et rendue interactive. Simple
 * variable de module : elle ne sert qu'à être lue au montage d'un composant,
 * jamais à déclencher un nouveau rendu.
 */
let firstPageIsInteractive = false;

/** À placer une seule fois, dans le gabarit racine. */
export function HydrationMark() {
  useEffect(() => {
    firstPageIsInteractive = true;
  }, []);
  return null;
}

/**
 * Enveloppe d'un gabarit (application, connexion, pages légales). Quand on y
 * arrive depuis un autre gabarit sans recharger la page, il apparaît en fondu
 * et son contenu principal monte légèrement (voir `shell-enter` et
 * `shell-rise` dans globals.css).
 *
 * Pourquoi pas une transition de vue : les arrivées les plus fréquentes ici
 * suivent une redirection d'action serveur (connexion, inscription,
 * déconnexion), que React applique sans transition. Cette entrée en CSS se
 * joue dans tous les cas.
 *
 * Au premier affichage de la page, rien ne s'anime : le contenu envoyé par le
 * serveur est visible tout de suite.
 */
export function Entrance({ className, children }: { className?: string; children: ReactNode }) {
  // Lu une fois, au montage : faux pendant l'hydratation de la première page
  // (comme sur le serveur), vrai pour tout gabarit monté ensuite.
  const [entering] = useState(() => firstPageIsInteractive);
  return (
    <div
      data-entering={entering ? "" : undefined}
      className={cn("group/shell", entering && "shell-enter", className)}
    >
      {children}
    </div>
  );
}
