# Coach (nom provisoire)

Un coach pour League of Legends : il conseille le joueur pendant la sélection des
champions, puis analyse ses parties classées pour l'aider à progresser.

Le nom du produit n'est pas encore choisi. Il vit dans une seule constante,
`APP_NAME` (`src/lib/config.ts`).

## État d'avancement

| Étape  | Contenu                                                          | État    |
| ------ | ---------------------------------------------------------------- | ------- |
| 1      | Socle, base de données, connexion, système de design, Paramètres | Fait    |
| 2      | API Riot, Data Dragon, synchronisation des parties               | Fait    |
| 4a     | Détail d'une partie (dix joueurs, objets, runes, vis-à-vis)      | Fait    |
| Esport | Calendrier, résultats, arbres et classements (PandaScore)        | Fait    |
| 3      | Coach de draft (capture, extraction, fiche en streaming)         | À faire |
| 4b     | Bilan d'une partie                                               | À faire |
| 5      | Tableau de bord global                                           | À faire |
| 6      | Finitions, pages légales définitives                             | À faire |

L'ordre suit les priorités du moment : le détail des parties et l'onglet
Esport (pendant les Worlds) passent avant le coach de draft.

## Installation

Prérequis : Node.js 22 ou plus, Docker Desktop ouvert (pour PostgreSQL).

```bash
npm install
cp .env.example .env        # puis remplis AUTH_SECRET : openssl rand -base64 33
docker compose up -d        # démarre PostgreSQL (port 5433)
npm run db:migrate          # crée les tables
npm run dev                 # http://localhost:3000
```

### Clé de l'API Riot

La synchronisation des parties a besoin d'une clé :

1. Connecte-toi sur <https://developer.riotgames.com> avec ton compte Riot.
2. Copie la « Development API Key » dans `RIOT_API_KEY` (fichier `.env`), puis
   relance `npm run dev`.

Une clé de développement expire au bout de 24 heures : il faut la régénérer sur
la même page. Sans clé, l'application fonctionne, mais le bouton « Mettre à
jour » du tableau de bord explique qu'elle manque.

### Clé PandaScore (onglet Esport)

L'onglet Esport lit le calendrier, les résultats, les arbres et les classements
sur PandaScore (offre gratuite, 1 000 appels par heure ; les réponses sont
gardées une minute en cache) :

1. Crée un compte sur <https://pandascore.co>.
2. Copie la clé (« token ») de ton tableau de bord dans `PANDASCORE_TOKEN`
   (fichier `.env`), puis relance `npm run dev`.

Sans clé, l'onglet explique qu'elle manque.

### Connexion Discord (facultatif)

Sans configuration, seule la connexion par e-mail et mot de passe est proposée.
Pour activer Discord :

1. Crée une application sur <https://discord.com/developers/applications>.
2. Dans **OAuth2**, ajoute l'URL de redirection
   `http://localhost:3000/api/auth/callback/discord`.
3. Copie l'identifiant et le secret dans `AUTH_DISCORD_ID` et `AUTH_DISCORD_SECRET`.

Le bouton « Continuer avec Discord » apparaît dès que les deux valeurs sont là.

## Commandes

| Commande              | Rôle                                                    |
| --------------------- | ------------------------------------------------------- |
| `npm run dev`         | Serveur de développement                                |
| `npm run build`       | Build de production                                     |
| `npm run check`       | Types + lint + tests (à lancer avant chaque commit)     |
| `npm run test`        | Tests seuls (les tests d'intégration utilisent la base) |
| `npm run format`      | Formate tout le code avec Prettier                      |
| `npm run db:generate` | Génère une migration après modification du schéma       |
| `npm run db:migrate`  | Applique les migrations                                 |
| `npm run db:studio`   | Explore la base dans le navigateur                      |

## Architecture

```
src/
  app/                  Pages et actions serveur (aucune logique métier)
    (auth)/             Connexion, inscription
    (app)/              Pages protégées : tableau de bord, draft, parties, actus, paramètres
    (legal)/            CGU, confidentialité
    fonts/              Polices embarquées et leurs licences
    globals.css         Système de design : jetons, mouvement, transitions de vue
  components/
    ui/                 Composants de base (bouton, champ, panneau, dialogue, lien…)
    brand/              Logo
    layout/             En-tête, barre d'onglets, pied de page, gabarit de page
    map/                Mini-carte tactique et pictogrammes des rôles
    draft/              Fiche de draft : plans, courbe de puissance, texte qui s'écrit
    auth/ settings/
  lib/
    config.ts           Nom de l'app, rôles, serveurs Riot
    env.ts              Variables d'environnement validées au démarrage
    db/                 Schéma, client, accès aux données filtré par utilisateur
    auth/               Session, mots de passe, droits par offre
    validation/         Schémas Zod partagés
    draft/              Calculs de la fiche (courbes de puissance, phases de jeu)
    ddragon/            Data Dragon : patchs, noms et portraits des champions
    riot/               Client de l'API Riot (comptes, classement, parties)
    stats/              Ce qu'on retient d'une partie brute
    sync/               Synchronisation d'un compte Riot
    format.ts           Nombres, durées et dates en français
    motion.ts           Petites animations pilotées en JavaScript
    view-transitions.ts Vocabulaire des transitions entre pages
  i18n/fr.ts            Tous les textes de l'interface
drizzle/                Migrations SQL générées
```

Trois règles tiennent l'ensemble :

1. **Couches.** Les pages et composants n'accèdent jamais à la base directement :
   ils passent par `src/lib/db/*`. Une règle ESLint l'impose.
2. **Isolation.** Chaque fonction d'accès aux données prend `userId` en premier
   argument et l'inclut dans sa requête. Des tests d'intégration vérifient qu'un
   utilisateur ne peut ni lire ni modifier les données d'un autre.
3. **Validation.** Toute donnée venant de l'extérieur (formulaires, et bientôt
   API Riot et réponses du modèle) passe par un schéma Zod. Aucun `any`.

### Multi-utilisateur

L'application est utilisable par plusieurs joueurs dès maintenant : chaque donnée
est rattachée à un utilisateur, et un champ `plan` (gratuit ou premium) alimente
`src/lib/auth/entitlements.ts`, seul endroit où les limites par offre sont
définies. Le paiement n'est pas implémenté.

### Système de design

L'idée directrice : **le tableau du coach, de nuit**. Un fond anthracite chaud,
presque neutre, des tracés clairs comme à la craie, et une seule couleur vive,
le corail, réservée à ce que le coach dit de faire (actions, trajets, choix). Le
fond reste discret : la couleur vient des visuels du jeu et des résultats.

- **Jetons.** Couleurs, typographie, rayons, durées et courbes sont définis dans
  `src/app/globals.css`. Les composants n'utilisent que ces jetons : changer la
  couleur d'accent ou une police se fait en un seul endroit.
- **Polices.** Sofia Sans Extra Condensed pour les titres et les pseudos,
  Atkinson Hyperlegible Next pour le texte. Elles sont embarquées
  (`src/app/fonts`, licence OFL), sans appel à un service tiers.
- **Carte.** La mini-carte (`src/components/map`) est un schéma dessiné pour le
  projet, pas une image du jeu : alliés en ronds pleins, adversaires en losanges
  creux, trajets conseillés en corail. Les pictogrammes des rôles en sont tirés.

### Mouvement

Une animation doit dire quelque chose : d'où vient un élément, ce qui a changé,
ce que l'application attend. Le reste ne bouge pas.

| Besoin                                     | Outil                                                |
| ------------------------------------------ | ---------------------------------------------------- |
| Réponse à un geste (appui, survol, focus)  | Transitions CSS, jetons `--duration-*` et `--ease-*` |
| Ce qui arrive ou se pose                   | Courbes « ressort » `--ease-spring*`                 |
| Entrée en scène orchestrée (la fiche)      | Utilitaires `intro-*` et `--intro-delay`, en CSS pur |
| Changement de page, liste qui se réordonne | Transitions de vue (`<ViewTransition>` de React)     |
| Signe de refus, valeur qui glisse          | `src/lib/motion.ts`                                  |

Les transitions de vue suivent quelques règles, détaillées dans `CLAUDE.md` :

- une page ne s'anime que si la navigation vient d'un lien de l'application
  (`src/components/ui/link.tsx`), pas du bouton Retour ;
- un squelette et le contenu qui le remplace portent le même nom : l'un se fond
  dans l'autre sur place ;
- elles restent courtes (300 ms pour une page), car React attend la fin d'une
  transition avant d'afficher la suite.

Tout respecte `prefers-reduced-motion` : les états restent les mêmes, seul le
trajet disparaît.

## Choix techniques notables

- **Synchronisation à la demande.** Le joueur clique sur « Mettre à jour » : le
  compte est vérifié auprès de Riot, son classement relevé, et ses 20 dernières
  parties classées téléchargées si elles manquent. Relancer ne duplique rien, et
  une interruption (limite d'appels de Riot) se reprend au clic suivant.

- **Drizzle plutôt que Prisma.** Les migrations se génèrent en JavaScript pur,
  sans binaire à télécharger, et les types viennent directement du schéma.
- **Composants écrits dans le projet**, sur le modèle de shadcn/ui (primitives
  Radix + variantes), sans passer par son installateur.
- **Rendu à chaque requête.** `cacheComponents` de Next.js est désactivé : toutes
  les pages dépendent de l'utilisateur connecté. À réévaluer à l'étape 5.

## Conformité Riot Games

Le produit devra être enregistré et validé sur le portail développeur de Riot
avant toute ouverture au public. Règles déjà prises en compte :

- la mention légale de Riot figure dans le pied de page de chaque écran ;
- l'interface ne reprend pas les codes graphiques du client de jeu ;
- le coach propose plusieurs options plutôt qu'une réponse unique ;
- aucun calcul de MMR ou d'ELO.

## Mise en ligne

Le guide pas à pas (Vercel + Neon, variables, clé Riot) est dans
[`docs/MISE-EN-LIGNE.md`](docs/MISE-EN-LIGNE.md).

Déjà en place : limitation des essais de connexion (5 par e-mail et 30 par
adresse IP toutes les 15 minutes) et d'inscription (10 par adresse IP et par
heure), en-têtes de sécurité, migrations lancées au déploiement.

Reste à faire avant une ouverture au public :

- vérification de l'adresse e-mail et réinitialisation du mot de passe ;
- rédaction des CGU et de la politique de confidentialité ;
- clé Riot personnelle ou de production (une clé de développement expire en 24 h).
