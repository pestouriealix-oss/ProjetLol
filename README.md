# Gufo

Un coach pour League of Legends : il conseille le joueur pendant la sélection des
champions, puis analyse ses parties classées pour l'aider à progresser.

Le nom (« hibou » en italien) vit dans une seule constante, `APP_NAME`
(`src/lib/config.ts`) ; le domaine visé est `gufo.gg`.

## État d'avancement

| Étape    | Contenu                                                                        | État    |
| -------- | ------------------------------------------------------------------------------ | ------- |
| 1        | Socle, base de données, connexion, système de design, Paramètres               | Fait    |
| 2        | API Riot, Data Dragon, synchronisation des parties                             | Fait    |
| 4a       | Détail d'une partie (dix joueurs, objets, runes, vis-à-vis)                    | Fait    |
| Esport   | Calendrier, résultats, arbres et classements (PandaScore)                      | Fait    |
| Actus    | Articles en français et en anglais (flux RSS), patchs                          | Fait    |
| 3        | Coach de draft (capture, extraction, fiche en streaming)                       | Fait    |
| 4b       | Bilan d'une partie (faits vérifiés, points forts, axes de progrès)             | Fait    |
| En ligne | E-mails (confirmation, mot de passe oublié), pages légales, collecte planifiée | Fait    |
| 5        | Progression (objectif chiffré vérifié, tendances), rappel au tableau de bord   | Fait    |
| 6        | Finitions                                                                      | À faire |

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

### Depuis un autre appareil (PC de jeu, téléphone)

`npm run dev` affiche une adresse « Network » (`http://192.168.x.x:3000`) :
ouverte depuis un autre appareil du même réseau, elle donne le même site, avec
la même base. Le serveur de développement accepte les adresses de l'ordinateur
qui le fait tourner (`next.config.ts`). Sur Mac, autoriser Node.js si le
pare-feu le demande.

### Clé Anthropic (coach de draft)

La page « Nouvelle game » remplit la draft toute seule : dès l'écran de
chargement, elle la lit chez Riot (Spectator-V5, vérifiée toutes les 10 s) et
lance aussitôt la fiche. À défaut, une capture lue par Claude Haiku remplit le
tableau. La fiche est écrite par Claude Sonnet (prompts versionnés dans
`src/lib/llm/prompts/`) :

1. Crée un compte sur <https://console.anthropic.com> et ajoute du crédit
   (**Billing**).
2. **Settings → API Keys → Create Key**, puis copie la clé dans
   `ANTHROPIC_API_KEY` (fichier `.env`) et relance `npm run dev`.

Chaque fiche est enregistrée (`draft_analyses`) et a sa propre adresse
(`/draft/<id>`), pour la relire sur téléphone pendant le chargement. Le nombre
de fiches par 24 heures dépend de l'offre (`src/lib/auth/entitlements.ts`), et
les lectures de capture sont limitées à 30 par heure. Sans clé, la page
l'explique ; la partie en cours remplit quand même le tableau.

La fiche part en deux appels simultanés : les conditions de victoire (propres à
la partie) et le duel contre le vis-à-vis. Le duel ne dépend que des deux
champions (et du duo en bas) : il est gardé (`matchup_notes`) et resservi aux
joueurs suivants du même duel, sur le même patch, avec le même modèle et le
même verdict des statistiques. Il s'affiche alors aussitôt et ne coûte rien.

Offres : 3 fiches par jour en gratuit, 40 en Premium.

Chaque appel au modèle est compté (`llm_usages` : jetons et coût en
micro-dollars, d'après `src/lib/llm/pricing.ts`). `npm run llm:costs` donne le
coût moyen réel d'une fiche et la part des duels resservis, pour régler les
prix. Deux réglages facultatifs du `.env` :

- `DRAFT_SHEET_MODEL` : le modèle de la fiche et du bilan (Haiku par défaut,
  environ vingt fois moins cher ; `claude-sonnet-5-5` seulement si Haiku déçoit
  vraiment).
- `LLM_MONTHLY_BUDGET_USD` : au-delà de ce montant dépensé dans le mois, les
  fiches gratuites se mettent en pause jusqu'au mois suivant ; Premium continue.

### Premium et paiement (Paddle)

Premium coûte 2,99 € par mois ou 24,99 € par an (`src/lib/billing/plans.ts`) :
40 fiches et 40 bilans par jour, 3 comptes Riot (1 en gratuit). Le paiement passe par Paddle, revendeur
officiel (« merchant of record ») : il encaisse, facture et reverse la TVA de
chaque pays ; le site ne voit jamais de carte. Frais : 5 % + 0,50 $ par
paiement.

1. Crée un compte de test sur <https://sandbox-vendors.paddle.com>.
2. **Catalog → Products** : un produit « Gufo Premium » avec deux prix
   récurrents, 2,99 € par mois et 24,99 € par an ; copie leurs identifiants
   (`pri_…`) dans `PADDLE_PRICE_ID` et `PADDLE_PRICE_ID_YEARLY`. Sans le
   second, la page ne propose que le mois.
3. **Developer tools → Authentication** : une clé d'API (`PADDLE_API_KEY`) et
   un jeton client (`PADDLE_CLIENT_TOKEN`, il commence par `test_`).
4. **Developer tools → Notifications** : une destination vers
   `https://<ton site>/api/billing/paddle` avec les événements
   `subscription.*` et `transaction.completed` ; sa clé secrète va dans
   `PADDLE_WEBHOOK_SECRET`. En local, Paddle ne peut pas joindre `localhost` :
   il faut un tunnel (par exemple `cloudflared tunnel --url http://localhost:3000`).
5. Paye avec une carte de test Paddle (4242 4242 4242 4242, date future, CVC 100) depuis la page Premium.

La notification de Paddle passe l'utilisateur en Premium
(`subscriptions`, `users.plan`) ; une résiliation le repasse en gratuit à la
fin de la période payée. « Gérer mon abonnement » ouvre le portail client de
Paddle (factures, moyen de paiement, résiliation).

**Offre fondateurs.** Un compte créé avec une invitation (`users.invite_id`)
est fondateur : la page Premium lui garantit 2,99 € par mois à vie. Tant que le
prix public ne change pas, il n'y a rien à faire ; le jour où il monte, crée le
nouveau prix chez Paddle pour `PADDLE_PRICE_ID` et mets l'ancien dans
`PADDLE_PRICE_ID_FOUNDERS` (un abonnement déjà en cours garde de toute façon
son prix chez Paddle). Au lancement, `npm run invites -- --founders-trial 14`
offre 14 jours de Premium, sans carte, aux fondateurs qui ne les ont pas eus
(`users.premium_trial_ends_at`, lu par `effectivePlan` dans
`src/lib/auth/entitlements.ts`).

### Riot Sign On

« Se connecter avec Riot », dans Paramètres, lie un compte sans taper son
Riot ID : le joueur se connecte chez Riot, qui confirme son identité ; le
compte est vérifié, et sa propriété prouvée, d'office. Il faut un client RSO, que Riot n'accorde qu'aux
produits dont la clé de production est approuvée (`RIOT_RSO_CLIENT_ID`,
`RIOT_RSO_CLIENT_SECRET`, adresse de retour
`https://<ton site>/api/riot/rso/callback`). Sans lui, le bouton n'apparaît
pas et l'ajout par Riot ID reste le seul moyen.

### Propriété d'un compte

N'importe qui peut lier un Riot ID : tout ce que le site en montre (parties,
rang, stats) est public, comme sur les sites de statistiques. Le coach, lui
(bilans, objectifs, fiche en direct, partie en cours), ne travaille que pour
un compte dont la propriété est prouvée (`riot_accounts.owned_at`). Sans Riot
Sign On, la preuve se fait par l'icône (`src/lib/sync/ownership.ts`) : le site
demande une icône de départ (Data Dragon 0 à 28, que tout compte possède), le
joueur la met dans le client du jeu, et le site vérifie chez Riot (Summoner-V4)
qu'elle y est, dans les 15 minutes.

### Bilan de partie

Sur la page d'une partie, « Écrire mon bilan » fait écrire par le coach ce qui
a marché, ce qui a coûté, et deux ou trois façons de progresser pour chaque
axe. Le modèle ne reçoit que des faits calculés (`src/lib/stats/review.ts`) :
écarts d'or, de sbires et d'expérience avec le vis-à-vis à 10 et 15 minutes,
moments des morts (dont celles juste avant un objectif adverse), écart d'or des
équipes, objectifs, et les habitudes du joueur à ce poste sur ses autres
parties classées. Ces chiffres sont affichés avec le bilan, enregistré
(`match_reviews`) et relu aux visites suivantes. Quota : 3 bilans par jour en
gratuit, 40 en Premium ; même modèle que la fiche (`DRAFT_SHEET_MODEL`).

Les chronologies enregistrées avant ce bilan (version 1) sont redemandées une
fois à Riot à la première visite.

### Progression

Chaque bilan fixe un objectif chiffré : un indicateur et une cible
(`src/lib/stats/goals.ts`), parmi CS par minute, morts, KP, vision par minute,
pinks achetées et dégâts par minute. Tous se calculent avec les chiffres de fin
de partie, sans chronologie. La page Progression le vérifie seule sur les
parties commencées après l'écriture du bilan, au même poste, hors remakes,
jusqu'au bilan suivant. Elle trace aussi les indicateurs du poste sur les 20
dernières parties, avec la moyenne et la comparaison des cinq dernières aux
précédentes. Le tableau de bord rappelle l'objectif en cours. Les bilans d'avant
la version 8 du prompt n'ont pas d'objectif chiffré.

### Statistiques de matchups (fiche de draft)

La fiche s'appuie sur des données vérifiées, données au modèle avant qu'il
écrive et citées en bas de la fiche :

- **Compétences** : passif, sorts et délais de récupération des deux champions
  du duel, pour le patch en cours (Data Dragon, en français).
- **Taux de victoire** : calculés par nous à partir de vraies parties classées
  Solo/Duo Émeraude et plus (API Riot officielle : League-V4 puis Match-V5),
  par patch, poste et duel. Affichés avec leur nombre de parties ; en dessous
  de 40 parties, la fiche le dit au lieu de donner un chiffre. Seuls des
  compteurs et l'identifiant des parties sont gardés, aucun joueur.

Pour remplir ces statistiques, lance la collecte (elle utilise `RIOT_API_KEY`
et la base du `.env`) :

```bash
npm run matchups:collect                     # 30 minutes sur EUW
npm run matchups:collect -- --minutes 120    # plus longtemps
```

Avec une clé de développement, compte environ 1 800 parties par heure (la
collecte laisse une vingtaine d'appels sur cent au site) : il en
faut quelques milliers pour couvrir les duels courants d'un patch. On peut
l'arrêter à tout moment (Ctrl + C) ; ce qui est compté reste compté. Les mêmes
compteurs servent à deviner les postes de la partie en cours.

### Articles (onglet Actus)

L'onglet Actus affiche les derniers articles sur League of Legends et sa scène,
lus dans des flux RSS publics (liste dans `src/lib/news/sources.ts`) : titre,
court extrait et lien vers l'article, jamais son texte. Seuls les articles de
moins de deux semaines s'affichent, une vingtaine au plus. Chaque flux est relu
au plus tous les quarts d'heure ; un site qui ne répond pas est signalé sans
masquer les autres. `npm run news:check` teste des flux candidats.

La plupart des sites d'esport bloquent les lecteurs RSS : l'essentiel vient donc
de Google Actualités (recherche « League of Legends », en français et en
anglais). Ses conditions réservent ces flux à un usage personnel et non
commercial : **avant d'ouvrir le site au public payant**, il faudra passer par
une API d'actualités sous licence (GNews, NewsAPI…) ou des accords avec les
sites.

### E-mails (facultatif en local)

La confirmation de l'adresse et le lien « mot de passe oublié » partent par
[Resend](https://resend.com) (`RESEND_API_KEY`, `EMAIL_FROM`, voir
`.env.example`). Sans clé, rien ne part : l'e-mail s'écrit dans le terminal de
`npm run dev`, avec son lien à ouvrir, et le coach n'attend pas de
confirmation. En ligne, le coach (fiches, captures, bilans) n'est ouvert
qu'aux adresses confirmées.

### Test fermé : invitations et liste d'attente

Tant que `SIGNUP_MODE` vaut `invite` (par défaut), on ne crée un compte qu'avec
un code d'invitation : la clé Personal de Riot n'autorise qu'une petite
communauté privée. Sans code, `/register` propose la liste d'attente (adresse +
accord, et la source `?ref=` d'un lien de créateur). Un code se saisit sur la
page ou arrive dans le lien `/register?code=…` ; avec Discord, il voyage dans
un cookie de 15 minutes et la place n'est prise qu'au retour. Une place est
prise d'un seul coup (`consumeInvite`), et rendue si l'inscription échoue.

```bash
npm run invites -- --create 10 --note "amis"          # 10 codes à une place
npm run invites -- --create 1 --uses 50 --note "createur-x"
npm run invites -- --wave 20                           # e-mail aux 20 plus anciens de la liste
npm run invites -- --summary
```

`--wave` a besoin de Resend ; `--days N` donne une date limite aux codes.
`npm run invites:prod` fait de même sur la base en ligne, avec les valeurs de
`.env.neon` (voir `docs/MISE-EN-LIGNE.md`). Le jour du lancement,
`SIGNUP_MODE=open` ouvre l'inscription à tous.

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
| `npm run invites`     | Codes d'invitation et vagues de la liste d'attente      |

## Architecture

```
src/
  app/                  Pages et actions serveur (aucune logique métier)
    (auth)/             Connexion, inscription, mot de passe oublié, confirmation d'adresse
    (app)/              Pages protégées : tableau de bord, draft, parties, actus, paramètres
    (legal)/            Conditions d'utilisation, confidentialité, mentions légales
    fonts/              Polices embarquées et leurs licences
    globals.css         Système de design : jetons, mouvement, transitions de vue
  components/
    ui/                 Composants de base (bouton, champ, panneau, dialogue, lien…)
    brand/              Logo
    layout/             En-tête, barre d'onglets, pied de page, gabarit de page
    map/                Mini-carte tactique et pictogrammes des rôles
    draft/              Nouvelle game : la draft, la fiche qui s'écrit en direct
    auth/ settings/
  lib/
    config.ts           Nom de l'app, rôles, serveurs Riot
    env.ts              Variables d'environnement validées au démarrage
    db/                 Schéma, client, accès aux données filtré par utilisateur
    auth/               Session, mots de passe, droits par offre, liens par e-mail
    email/              Envoi des e-mails (Resend) et leurs modèles
    validation/         Schémas Zod partagés
    draft/              La draft : champions, postes, partie en cours, fiche
    ddragon/            Data Dragon : patchs, noms et portraits des champions
    news/               Flux RSS des sites d'actualité (titre, extrait, lien)
    riot/               Client de l'API Riot (comptes, classement, parties)
    stats/              Ce qu'on retient d'une partie brute
    sync/               Synchronisation d'un compte Riot
    format.ts           Nombres, durées et dates en français
    motion.ts           Petites animations pilotées en JavaScript
    view-transitions.ts Vocabulaire des transitions entre pages
  i18n/fr.ts            Tous les textes de l'interface, assemblés depuis i18n/fr/
                        (un fichier par partie du site)
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
- **Boutons.** Quatre niveaux (`src/components/ui/button.tsx`) : `coach` (corail,
  seulement pour faire travailler le coach : Nouvelle game, Écrire ma fiche,
  Écrire mon bilan), `solid` (craie pleine, l'action principale de tout le
  reste, par défaut), `secondary` (contour) et `ghost`, plus `danger`. Un choix
  du joueur (rôle sélectionné, badge « Principal ») est en craie, jamais en
  corail : `Badge tone="strong"`.
- **Chiffres.** Sous 5 parties, pas de pourcentage de victoires mais le bilan
  brut (« 2 V – 0 D », `src/components/stats/winrate.tsx`). Les écarts se lisent
  au signe et à la couleur (vert en avance, rouge en retard, neutre à égalité),
  et les graphiques portent leurs repères : divisions et progression nette sur
  la courbe des LP, minutes et légende des objectifs sur l'écart d'or.
- **Art des champions.** En tête du tableau de bord (champion le plus joué), du
  détail d'une partie et de l'accueil (un champion par jour), l'art officiel de
  Data Dragon apparaît dans un cercle de vision, comme une ward dans le
  brouillard (`vision-mask`, `ChampionBackdrop`). Le reste reste calme : un grain
  très fin sur le terrain, des panneaux posés (`shadow-panel`).
- **Logo.** Le G-œil : un G dont le creux est l'œil d'un hibou, pupille en
  corail (`src/components/brand/mark.tsx`), seul, sans le nom écrit.
- **Vocabulaire.** Celui des joueurs : CS, KP, pink, drake, nash, grubs, inhib.

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
