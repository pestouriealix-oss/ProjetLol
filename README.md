# Coach (nom provisoire)

Un coach pour League of Legends : il conseille le joueur pendant la sélection des
champions, puis analyse ses parties classées pour l'aider à progresser.

Le nom du produit n'est pas encore choisi. Il vit dans une seule constante,
`APP_NAME` (`src/lib/config.ts`).

## État d'avancement

| Étape | Contenu                                                          | État    |
| ----- | ---------------------------------------------------------------- | ------- |
| 1     | Socle, base de données, connexion, système de design, Paramètres | Fait    |
| 2     | API Riot, Data Dragon, synchronisation des parties               | À faire |
| 3     | Coach de draft (capture, extraction, fiche en streaming)         | À faire |
| 4     | Détail d'une partie et bilan                                     | À faire |
| 5     | Tableau de bord global                                           | À faire |
| 6     | Finitions, pages légales définitives                             | À faire |

## Installation

Prérequis : Node.js 22 ou plus, Docker (pour PostgreSQL).

```bash
npm install
cp .env.example .env        # puis remplis AUTH_SECRET : npx auth secret
docker compose up -d        # démarre PostgreSQL
npm run db:migrate          # crée les tables
npm run dev                 # http://localhost:3000
```

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
    (app)/              Pages protégées : tableau de bord, draft, parties, paramètres
    (legal)/            CGU, confidentialité
  components/
    ui/                 Composants de base (bouton, champ, panneau, dialogue…)
    layout/             En-tête, barre d'onglets, pied de page
    auth/ settings/ draft/
  lib/
    config.ts           Nom de l'app, rôles, serveurs Riot
    env.ts              Variables d'environnement validées au démarrage
    db/                 Schéma, client, accès aux données filtré par utilisateur
    auth/               Session, mots de passe, droits par offre
    validation/         Schémas Zod partagés
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

Les jetons (couleurs, typographie, rayons, durées) sont définis dans
`src/app/globals.css`. Les composants n'utilisent que ces jetons. Les polices
(Space Grotesk, Inter, JetBrains Mono) sont embarquées, sans appel à un service
tiers.

## Choix techniques notables

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

## Reste à faire avant une mise en ligne

- Limitation du nombre de tentatives de connexion.
- Vérification de l'adresse e-mail et réinitialisation du mot de passe.
- Rédaction des CGU et de la politique de confidentialité.
