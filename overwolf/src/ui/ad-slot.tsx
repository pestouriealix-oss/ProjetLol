import { useEffect, useRef } from "react";

import { Mark } from "@/components/brand/mark";

import type { OwAd } from "@overwolf/types/owads";

declare global {
  interface Window {
    OwAd?: typeof OwAd;
  }
}

const SIZE = { width: 400, height: 300 };

/**
 * L'emplacement de pub Overwolf (400 × 300), dans la fenêtre de bureau
 * seulement : jamais en jeu ni à l'écran de chargement (règles de Riot). Un
 * aplat avec le logo tient la place tant qu'aucune pub n'est servie. Quand la
 * fenêtre est réduite, la pub s'arrête ; elle reprend à son retour.
 */
export function AdSlot() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = container.current;
    let ad: OwAd | null = null;
    let tries = 0;
    // Le script des pubs se charge à part : on l'attend quelques secondes.
    const timer = window.setInterval(() => {
      tries += 1;
      if (window.OwAd && element) {
        ad = new window.OwAd(element, { size: SIZE });
        window.clearInterval(timer);
      } else if (tries > 20) {
        window.clearInterval(timer);
      }
    }, 500);

    const onState = (event: overwolf.windows.WindowStateChangedEvent) => {
      if (!ad || event.window_name !== "desktop") return;
      if (event.window_state_ex === "minimized" || event.window_state_ex === "hidden")
        ad.removeAd();
      else if (event.window_state_ex === "normal" || event.window_state_ex === "maximized")
        ad.refreshAd({});
    };
    if (typeof overwolf !== "undefined") overwolf.windows.onStateChanged.addListener(onState);

    return () => {
      window.clearInterval(timer);
      if (typeof overwolf !== "undefined") overwolf.windows.onStateChanged.removeListener(onState);
      void ad?.shutdown();
    };
  }, []);

  return (
    <div className="relative shrink-0" style={SIZE}>
      {/* Aplat derrière l'emplacement, comme le demande Overwolf. */}
      <div
        aria-hidden
        className="absolute inset-0 grid place-items-center rounded-control bg-raised"
      >
        <Mark compact className="h-12 text-line-strong" accentClassName="fill-line-strong" />
      </div>
      <div ref={container} className="absolute inset-0" />
    </div>
  );
}
