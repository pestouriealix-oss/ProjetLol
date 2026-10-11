/**
 * Petits outils d'animation pilotés en JavaScript, pour les rares cas où le
 * CSS ne suffit pas. Tout le reste du mouvement vit dans `globals.css`.
 */

/** Vrai si la personne a demandé moins d'animations. Côté navigateur uniquement. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Petit « non » de la tête : signale un refus (champ invalide) sans attendre
 * que le message soit lu.
 */
export function nudge(element: HTMLElement | null): void {
  if (!element || prefersReducedMotion()) return;
  element.animate(
    { translate: ["0", "-7px", "6px", "-4px", "2px", "0"] },
    { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
}

const easeOutExpo = (progress: number) => (progress >= 1 ? 1 : 1 - 2 ** (-10 * progress));

/**
 * Fait glisser une valeur de `from` à `to`. `onUpdate` reçoit chaque valeur
 * intermédiaire, puis exactement `to` avec `done` à vrai. Renvoie une fonction
 * d'annulation. Avec le mouvement réduit, la valeur saute directement à l'arrivée.
 */
export function tween(
  from: number,
  to: number,
  onUpdate: (value: number, done: boolean) => void,
  durationMs = 520,
): () => void {
  if (prefersReducedMotion() || from === to) {
    onUpdate(to, true);
    return () => {};
  }

  let frame = 0;
  // Le départ est l'heure de la première image, lue sur la même horloge que les
  // suivantes. Avec `performance.now()`, les deux horloges peuvent diverger (un
  // navigateur qui ralentit les animations, par exemple) : la progression
  // deviendrait négative et la courbe d'accélération renverrait une valeur
  // délirante. Elle est aussi bornée, par précaution.
  let start: number | undefined;
  const step = (now: number) => {
    start ??= now;
    const progress = Math.min(1, Math.max(0, (now - start) / durationMs));
    if (progress >= 1) {
      onUpdate(to, true);
      return;
    }
    onUpdate(from + (to - from) * easeOutExpo(progress), false);
    frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}
