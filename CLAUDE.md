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
  Data Dragon dans `src/lib/ddragon`, les calculs dans `src/lib/stats`.
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
- **Design.** Uniquement les jetons de `src/app/globals.css`. Chaque écran gère
  ses quatre états : chargement, vide, erreur, rempli.
- **Riot.** Le coach propose toujours plusieurs options ; aucun calcul de MMR ;
  visuels du jeu via Data Dragon uniquement.
- **Prompts.** Les prompts du modèle vivront dans des fichiers séparés et
  versionnés (`src/lib/llm/prompts/`).

## Avant chaque commit

`npm run check` (types, lint, tests) puis `npm run build`. Schéma modifié :
`npm run db:generate` et commiter la migration.
