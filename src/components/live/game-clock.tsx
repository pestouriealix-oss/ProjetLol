"use client";

import { useEffect, useState } from "react";

import { formatDuration } from "@/lib/format";

/**
 * Durée de la partie, qui avance d'elle-même chaque seconde. Rendue d'abord
 * côté serveur avec l'heure du serveur, puis tenue à jour dans le navigateur.
 */
export function GameClock({ startedAt, serverNow }: { startedAt: string; serverNow: string }) {
  const start = new Date(startedAt).getTime();
  const [now, setNow] = useState(() => new Date(serverNow).getTime());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <time dateTime={startedAt} className="tabular">
      {formatDuration(Math.max(0, (now - start) / 1000))}
    </time>
  );
}
