# Mettre Kairos en ligne

Le site tourne sur **Vercel** (hébergement Next.js) avec une base PostgreSQL
**Neon**. Les deux ont une offre gratuite suffisante pour un usage personnel ou
un petit groupe de testeurs. Compte environ 20 minutes la première fois.

## 1. La base de données (Neon)

1. Crée un compte sur <https://neon.tech> (connexion avec GitHub possible).
2. Crée un projet : nom `kairos`, version PostgreSQL 16, région **Europe
   (Frankfurt)**. Le site est réglé pour tourner à Francfort aussi
   (`vercel.json`), à côté de la base.
3. Dans **Connection details**, choisis **Pooled connection** et copie
   l'adresse. Elle ressemble à
   `postgresql://…@ep-…-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`.

La version « pooled » est importante : Vercel lance plusieurs petites
instances du site, et le pool de Neon partage les connexions entre elles.
Copie aussi l'adresse **sans** pool (décoche « Pooled connection ») : elle
sert aux migrations.

## 2. Le site (Vercel)

1. Crée un compte sur <https://vercel.com> avec ton compte GitHub.
2. **Add New → Project**, choisis le dépôt `ProjetLol`, puis **Import**.
3. Avant de lancer le déploiement, ouvre **Environment Variables** et ajoute :

   | Nom                     | Valeur                                                                  |
   | ----------------------- | ----------------------------------------------------------------------- |
   | `DATABASE_URL`          | l'adresse Neon « pooled » de l'étape 1                                  |
   | `DATABASE_URL_UNPOOLED` | l'adresse Neon sans pool (pour les migrations)                          |
   | `AUTH_SECRET`           | un nouveau secret : `openssl rand -base64 33` (pas celui de ton `.env`) |
   | `RIOT_API_KEY`          | ta clé Riot (voir la partie 4)                                          |
   | `PANDASCORE_TOKEN`      | ta clé PandaScore                                                       |

   `AUTH_DISCORD_ID` et `AUTH_DISCORD_SECRET` sont facultatifs. Pour Discord,
   déclare aussi l'adresse de redirection
   `https://<ton-site>.vercel.app/api/auth/callback/discord` dans le portail
   Discord.

4. **Deploy**. Le fichier `vercel.json` du dépôt lance les migrations de la
   base, puis construit le site : il n'y a rien d'autre à configurer.

Le site est en ligne à l'adresse donnée par Vercel. Chaque `git push` sur la
branche principale le redéploie automatiquement ; une autre branche donne une
adresse de prévisualisation à part.

## 3. Vérifier

- Crée ton compte, lie ton Riot ID, clique sur « Mettre à jour ».
- Ouvre une partie, l'onglet Esport, la page Stats.
- En cas d'erreur, l'onglet **Logs** du projet Vercel affiche la cause.

## 4. La clé Riot en ligne

Une clé de **développement** expire toutes les 24 heures, et Riot n'autorise
pas son usage sur un site ouvert au public. Pour un site en ligne :

1. Sur <https://developer.riotgames.com>, **Register Product**, puis
   **Personal API Key** (projet personnel ou pour quelques amis).
2. Décris Kairos : un outil d'aide à la draft et de suivi de parties, sans
   calcul de MMR, avec plusieurs options proposées. Donne l'adresse Vercel.
3. Une fois la clé validée, remplace `RIOT_API_KEY` dans Vercel
   (**Settings → Environment Variables**), puis **Redeploy**.

Pour un vrai lancement public, il faudra une **Production API Key**, avec un
site fini, des CGU et une politique de confidentialité rédigées.

## 5. Avant d'ouvrir à d'autres personnes

Déjà en place : limitation des essais de connexion et d'inscription, en-têtes
de sécurité, clés uniquement côté serveur, données isolées par utilisateur.

Reste à faire :

- vérification de l'adresse e-mail et réinitialisation du mot de passe ;
- CGU et politique de confidentialité définitives ;
- clé Riot personnelle ou de production (partie 4).
