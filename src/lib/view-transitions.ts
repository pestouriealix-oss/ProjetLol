/**
 * Vocabulaire commun des transitions de vue (voir aussi la section
 * « Transitions de vue » de `src/app/globals.css`).
 *
 * Une page ne joue sa sortie et son entrée que si la navigation porte le type
 * `nav`, posé par le composant `Link` de l'application. Tout le reste n'a pas
 * de type et change donc sans effet d'arrivée :
 * - le contenu qui remplace son squelette de chargement (c'est un fondu sur
 *   place, pas une seconde arrivée) ;
 * - un rafraîchissement des données, ou une navigation lancée par le code.
 *
 * Le bouton Retour du navigateur, lui, ne lance aucune transition : Next.js
 * restaure la page précédente d'un coup (et un téléphone anime déjà ce geste).
 */
export const NAV_TRANSITION: string[] = ["nav"];

/** Classes d'une frontière de page, par type de transition. */
export const PAGE_ENTER = { nav: "page-enter", default: "none" } as const;
export const PAGE_EXIT = { nav: "page-exit", default: "none" } as const;

/**
 * Classe partagée par un squelette et le contenu qui le remplace : les deux
 * portent le même nom, React les apparie et le navigateur fond l'un dans
 * l'autre.
 */
export const PAGE_REVEAL = "page-reveal";

/** Nom de transition d'une page, commun à son squelette et à son contenu. */
export function pageTransitionName(route: string): string {
  return `page-${route}`;
}
