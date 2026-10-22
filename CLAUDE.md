# Conventions du projet

@AGENTS.md

## Contexte

Coach IA pour League of Legends (nom provisoire, voir `APP_NAME`). Le plan de
construction en six étapes et l'architecture sont décrits dans `README.md`.
Travailler une étape à la fois et attendre la validation entre chacune.

## Règles à respecter

- **Couches.** `src/app` et `src/components` n'importent jamais `@/lib/db/client`
  ni `drizzle-orm`. Tout accès aux données passe par un module de `src/lib/db`.
  De même, l'API Riot vivra dans `src/lib/riot`, le modèle dans `src/lib/llm`,
  Data Dragon dans `src/lib/ddragon`, PandaScore (esport) dans `src/lib/esport`,
  les flux d'articles (RSS) dans `src/lib/news`, les calculs dans `src/lib/stats`,
  le paiement (Paddle) dans `src/lib/billing`.
- **Articles.** Jamais le texte d'un article : titre, court extrait et lien vers
  le site qui l'a publié.
- **Isolation.** Toute fonction de `src/lib/db` qui touche une donnée personnelle
  prend `userId` en premier argument et l'utilise dans sa clause WHERE. Ajouter
  un cas dans `src/lib/db/isolation.test.ts` pour chaque nouvelle table.
- **Authentification.** Chaque page, action serveur ou route protégée commence
  par `await requireUser()`. Ne jamais se fier au seul layout.
- **Droits.** Ne jamais comparer `user.plan` directement : passer par
  `src/lib/auth/entitlements.ts`.
- **Validation.** Toute entrée externe passe par un schéma Zod. Aucun `any`.
  Les types sont dérivés des schémas Zod et du schéma Drizzle.
- **Textes.** Aucun texte en dur dans les composants : tout est dans
  `src/i18n/fr.ts`. Typographie française (espace insécable avant `:` et `?`).
- **Design.** Uniquement les jetons de `src/app/globals.css` (couleurs, polices,
  rayons, durées, courbes). Le corail est réservé à ce que le coach dit de faire.
  Chaque écran gère ses quatre états : chargement, vide, erreur, rempli.
- **Liens et pages.** Toujours `Link` de `@/components/ui/link`, jamais
  `next/link` (règle ESLint) : c'est lui qui déclenche la transition entre pages.
  Une page de l'application s'enveloppe dans `PageShell` ; son `loading.tsx`
  donne la même `route`, la même structure et les mêmes espacements, pour que le
  contenu se fonde à la place du squelette.
- **Riot.** Le coach propose toujours plusieurs options ; aucun calcul de MMR ;
  visuels du jeu via Data Dragon uniquement, sauf les emblèmes de rang
  officiels du portail développeur (`public/ranked-emblems`).
- **Prompts.** Les prompts du modèle vivront dans des fichiers séparés et
  versionnés (`src/lib/llm/prompts/`).

## Mouvement

Le principe et le choix de l'outil sont dans `README.md` (« Mouvement »). Durées
et courbes viennent des jetons `--duration-*` et `--ease-*` : le ressort pour ce
qui arrive, `--ease-in` court pour ce qui part. Vérifier chaque animation avec
`prefers-reduced-motion`.

Transitions de vue (`<ViewTransition>` de React), pièges déjà rencontrés :

- Elles ne se lancent que pour un rendu « transition » : navigation, mise à jour
  dans `startTransition`, contenu qui remplace un squelette. Une redirection
  d'action serveur n'en lance pas : c'est le composant `Entrance` des gabarits
  qui anime ces arrivées.
- Tant qu'une transition joue, React retient les rendus suivants et les effets
  ordinaires. Garder chaque transition courte (300 ms pour une page) et utiliser
  `useLayoutEffect` pour ce qui doit répondre tout de suite (focus, signe de
  refus).
- `default="none"` sur chaque frontière. N'armer `update` que pour le rendu qui
  déplace vraiment quelque chose (voir `riot-accounts-section.tsx`), sinon chaque
  rendu lance une transition pendant laquelle les lignes ne reçoivent pas les
  clics.
- Une transition lancée dans le même geste qu'une action serveur attend sa
  réponse. Afficher d'abord (état local dans `startTransition`), envoyer ensuite
  depuis un `useLayoutEffect`.
- `enter` et `exit` d'une page ne valent que pour le type `nav`
  (`src/lib/view-transitions.ts`) : le remplacement d'un squelette ne rejoue pas
  une arrivée de page. Le bouton Retour, lui, est appliqué par Next.js sans
  aucune transition.
- Un fondu entre deux images (`share`) dont on remplace l'animation doit reposer
  `mix-blend-mode: plus-lighter`, avec la même durée et la même courbe des deux
  côtés, sinon ce qui est identique des deux côtés s'assombrit en chemin.

Prettier trie les classes Tailwind : ne jamais modifier une chaîne de classes par
un rechercher-remplacer sans vérifier que le remplacement a bien eu lieu.

## Avant chaque commit

`npm run check` (types, lint, tests) puis `npm run build`. Schéma modifié :
`npm run db:generate` et commiter la migration.
