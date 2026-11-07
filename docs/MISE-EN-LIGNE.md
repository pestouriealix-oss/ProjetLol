# Mettre Gufo en ligne

Le site tourne sur **Vercel** (hébergement Next.js) avec une base PostgreSQL
**Neon**. Les e-mails partent par **Resend**, et la collecte des statistiques
tourne chaque nuit sur **GitHub Actions**. Tout a une offre gratuite suffisante
pour le test fermé. Compte environ une heure la première fois.

## 0. Le domaine

Achète `gufo.gg` chez un registraire (Porkbun est le moins cher pour les `.gg`,
environ 52 $ par an). Active aussi la **redirection d'e-mails** du registraire
(gratuite chez Porkbun) : `contact@gufo.gg` vers ta boîte personnelle. C'est
l'adresse de contact des pages légales.

## 1. La base de données (Neon)

1. Crée un compte sur <https://neon.tech> (connexion avec GitHub possible).
2. Crée un projet : nom `gufo`, version PostgreSQL 16, région **Europe
   (Frankfurt)**. Le site est réglé pour tourner à Francfort aussi
   (`vercel.json`), à côté de la base.
3. Dans **Connection details**, choisis **Pooled connection** et copie
   l'adresse. Elle ressemble à
   `postgresql://…@ep-…-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`.

La version « pooled » est importante : Vercel lance plusieurs petites instances
du site, et le pool de Neon partage les connexions entre elles. Copie aussi
l'adresse **sans** pool (décoche « Pooled connection ») : elle sert aux
migrations.

## 2. Les e-mails (Resend)

1. Crée un compte sur <https://resend.com>.
2. **Domains → Add Domain** : `gufo.gg`, région **EU (Ireland)**. Resend donne
   quelques enregistrements DNS (MX, TXT) : ajoute-les chez ton registraire,
   puis **Verify** (quelques minutes).
3. **API Keys → Create API Key**, droit « Sending access » : c'est
   `RESEND_API_KEY`.

Tant que Resend n'est pas configuré, rien n'est bloqué : les comptes n'ont pas
à confirmer leur adresse. Dès qu'il l'est, le coach (fiches, captures, bilans)
attend la confirmation, pour qu'une adresse jetable ne suffise pas à multiplier
les comptes gratuits.

## 3. Le site (Vercel)

1. Crée un compte sur <https://vercel.com> avec ton compte GitHub.
2. **Add New → Project**, choisis le dépôt `ProjetLol`, puis **Import**.
3. Avant de lancer le déploiement, ouvre **Environment Variables** et ajoute :

   | Nom                      | Valeur                                                                  |
   | ------------------------ | ----------------------------------------------------------------------- |
   | `DATABASE_URL`           | l'adresse Neon « pooled » de l'étape 1                                  |
   | `DATABASE_URL_UNPOOLED`  | l'adresse Neon sans pool (pour les migrations)                          |
   | `AUTH_SECRET`            | un nouveau secret : `openssl rand -base64 33` (pas celui de ton `.env`) |
   | `APP_URL`                | `https://gufo.gg`                                                       |
   | `RIOT_API_KEY`           | ta clé Riot (voir la partie 6)                                          |
   | `ANTHROPIC_API_KEY`      | ta clé Anthropic                                                        |
   | `LLM_MONTHLY_BUDGET_USD` | le plafond mensuel du coach gratuit, par exemple `20`                   |
   | `RESEND_API_KEY`         | la clé de l'étape 2                                                     |
   | `EMAIL_FROM`             | `Gufo <bonjour@gufo.gg>`                                                |
   | `PANDASCORE_TOKEN`       | ta clé PandaScore                                                       |
   | `SIGNUP_MODE`            | `invite` (test fermé) ; `open` seulement au lancement public            |

   `AUTH_DISCORD_ID` et `AUTH_DISCORD_SECRET` sont facultatifs. Pour Discord,
   déclare aussi l'adresse de redirection
   `https://gufo.gg/api/auth/callback/discord` dans le portail Discord. Les
   variables Paddle viennent plus tard, à l'ouverture de Premium (README,
   « Premium et paiement »).

4. **Deploy**. Le fichier `vercel.json` du dépôt lance les migrations de la
   base, puis construit le site : il n'y a rien d'autre à configurer.
5. **Settings → Domains** : ajoute `gufo.gg` et suis les indications DNS.

Chaque `git push` sur la branche principale redéploie le site ; une autre
branche donne une adresse de prévisualisation à part.

## 4. La collecte des statistiques (GitHub Actions)

Les statistiques de matchups de la fiche viennent d'une collecte de parties
classées (Émeraude et plus). Elle tourne chaque nuit sur les machines de GitHub
(`.github/workflows/collect-matchups.yml`), 40 minutes, en laissant de la marge
au site sur la limite d'appels de Riot.

1. Sur GitHub, dépôt `ProjetLol` → **Settings → Secrets and variables →
   Actions → New repository secret** : `DATABASE_URL` (l'adresse Neon) et
   `RIOT_API_KEY`.
2. Pour la lancer à la main : onglet **Actions → Collecte des matchups → Run
   workflow** (on peut changer la durée).

Une tâche planifiée ne tourne que depuis la branche principale (`main`). Avec
une clé de développement (qui expire chaque jour), la collecte de la nuit
échoue : il faut la clé personnelle de la partie 6.

## 5. Les pages légales

Dans `src/lib/config.ts`, complète `PUBLISHER` : ton nom, ton statut
(« Particulier », ou ton numéro SIRET si tu as une micro-entreprise) et
`contact@gufo.gg`. Tant que ce n'est pas fait, les pages affichent « À compléter
avant l'ouverture ». Les textes (conditions d'utilisation, confidentialité,
mentions légales) sont dans `src/i18n/fr/legal.ts` ; ce sont des bases sérieuses,
mais pas un avis d'avocat : fais-les relire avant l'ouverture au public et
avant d'encaisser Premium.

## 6. La clé Riot en ligne

Une clé de **développement** expire toutes les 24 heures, et Riot n'autorise
pas son usage sur un site ouvert au public. Pour un site en ligne :

1. Sur <https://developer.riotgames.com>, **Register Product**, puis
   **Personal API Key** (projet personnel ou petite communauté privée).
2. Décris Gufo avec le texte du dossier préparé, et donne l'adresse du site.
3. Une fois la clé validée, remplace `RIOT_API_KEY` dans Vercel
   (**Settings → Environment Variables**, puis **Redeploy**) et dans les
   secrets GitHub.

Pour un vrai lancement public, il faudra une **Production API Key**, avec le
site fini et en ligne.

## 7. Vérifier

- Sur ton Mac, crée un fichier `.env.neon` (jamais commité, comme `.env`) avec
  les valeurs du site en ligne : `DATABASE_URL` (Neon), `RESEND_API_KEY`,
  `EMAIL_FROM` et `APP_URL`. `npm run invites:prod` agit alors sur la base en
  ligne, `npm run invites` reste sur ta base locale.
- Crée ton propre code (`npm run invites:prod -- --create 1 --note moi`), puis
  un compte avec : l'e-mail de confirmation arrive, le lien confirme l'adresse.
- Sans code, `/register` propose la liste d'attente : inscris une adresse, puis
  `npm run invites:prod -- --wave 1` lui envoie son invitation.
- « Mot de passe oublié » depuis la page de connexion : le lien arrive et marche
  une seule fois.
- Lie ton Riot ID, clique sur « Mettre à jour », ouvre une partie et son bilan.
- En cas d'erreur, l'onglet **Logs** du projet Vercel affiche la cause.

## 8. Le jour du lancement public

Seulement avec la clé de production de Riot.

1. Dernière vague : `npm run invites:prod -- --wave <tous>` envoie un code à
   chaque personne encore sur la liste ; avec ce code, son compte sera
   fondateur.
2. Offre fondateurs : `npm run invites:prod -- --founders-trial 14` offre
   14 jours de Premium aux comptes venus par invitation. Relance-le dans les
   jours qui suivent pour ceux qui s'inscrivent avec leur code.
3. Dans Vercel, `SIGNUP_MODE` passe à `open`, puis **Redeploy** : tout le
   monde peut s'inscrire, et un code reste accepté (il donne le statut de
   fondateur).
4. Paddle en production : les deux prix (2,99 € par mois, 24,99 € par an) dans
   `PADDLE_PRICE_ID` et `PADDLE_PRICE_ID_YEARLY` (README, « Premium et
   paiement »).

## Déjà en place

Limitation des essais (connexion, inscription, liens), confirmation de
l'adresse e-mail, mot de passe oublié (qui ferme les autres sessions), en-têtes
de sécurité, clés uniquement côté serveur, données isolées par utilisateur,
conditions d'utilisation, politique de confidentialité et mentions légales.
