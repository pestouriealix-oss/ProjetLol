"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Toutes les 3 secondes pendant une minute, au plus. */
const EVERY_MS = 3000;
const FOR_MS = 60_000;

/**
 * Juste après le paiement, Premium attend la notification de Paddle : la page
 * se rafraîchit seule jusqu'à ce qu'elle soit arrivée.
 */
export function ActivationWatch() {
  const router = useRouter();
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - started > FOR_MS) window.clearInterval(timer);
      else router.refresh();
    }, EVERY_MS);
    return () => window.clearInterval(timer);
  }, [router]);
  return null;
}
