import { Fragment, type CSSProperties } from "react";

type StreamedProps = {
  text: string;
  /** Délai avant le premier mot, en millisecondes. */
  delay?: number;
  /** Écart entre deux mots, en millisecondes. */
  step?: number;
};

/**
 * Fait arriver un texte mot à mot, comme une réponse en cours d'écriture.
 * Le texte est entièrement présent dans la page dès le départ : seule son
 * apparition est échelonnée, donc il reste lisible sans animation et pour les
 * lecteurs d'écran.
 */
export function Streamed({ text, delay = 0, step = 28 }: StreamedProps) {
  // On ne coupe que sur les espaces ordinaires : une espace insécable (avant
  // « : » ou « ? ») garde la ponctuation collée à son mot.
  const words = text.split(" ");
  return words.map((word, index) => (
    <Fragment key={index}>
      <span
        className="intro-word"
        style={{ "--intro-delay": `${delay + index * step}ms` } as CSSProperties}
      >
        {word}
      </span>
      {index < words.length - 1 ? " " : null}
    </Fragment>
  ));
}
