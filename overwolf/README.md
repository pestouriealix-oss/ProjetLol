# Gufo pour Overwolf

L'app de bureau de Gufo : la fiche de draft s'ouvre toute seule à l'écran de
chargement de League of Legends, reste le temps d'aller en voie (45 secondes
de jeu), puis se range. Le raccourci (Ctrl+Shift+G) la rouvre en partie.

Elle ne fait que trois choses : suivre le client (sélection, chargement,
partie), demander la fiche au site (`/api/app/*`, avec le jeton de l'app) et
l'afficher. Tout le reste (comptes Riot, coach, quotas, Premium) vit sur le
site.

## Fenêtres

| Fenêtre      | Rôle                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| `background` | Cachée. Porte le contrôleur (`src/core/controller.ts`), suit le lanceur et le jeu |
| `desktop`    | Liaison au compte, étape en cours, dernière fiche, réglages, pub Overwolf         |
| `in_game`    | La fiche, à l'écran de chargement seulement. Raccourci : Ctrl+Shift+G             |

Règles de Riot tenues ici : aucun pseudo (on ne lit de la sélection que son
champion et son poste), rien pendant la partie, pas de pub en jeu ni à
l'écran de chargement, mention légale dans la fenêtre de bureau.

## Liaison au compte

Comme pour une télé : l'app demande un code (`POST /api/app/link`), ouvre
`gufo.gg/app?code=…` dans le navigateur, le joueur se connecte et valide, puis
l'app reçoit son jeton (`POST /api/app/token`). Le site n'en garde que
l'empreinte ; on coupe l'accès dans Paramètres.

## Développer sur le Mac

```bash
npm install                 # à la racine du dépôt : React, Zod, composants du site
npm run dev                 # le site, sur http://localhost:3000
cd overwolf && npm install
npm run dev                 # le banc d'essai, sur http://localhost:5173
```

Le banc d'essai montre les deux fenêtres côte à côte, avec des boutons pour
jouer les étapes du client (sélection, chargement, début de partie…). Il parle
au vrai site : la liaison, la partie en cours et la fiche passent par les
mêmes routes.

`npm run typecheck`, `npm test` et `npm run build` vérifient l'app.

## Essayer dans Overwolf, sur la tour Windows

1. Installe [Git](https://git-scm.com/download/win), [Node.js](https://nodejs.org)
   (version LTS) et Overwolf. Dans Overwolf, connecte-toi avec le compte
   whitelisté.
2. Sur le Mac, lance le site (`npm run dev`) et note son adresse « Network »
   (`http://192.168.x.x:3000`).
3. Sur la tour, dans l'**Invite de commandes** (`cmd`, pas PowerShell, qui
   bloque `npm` par défaut) :

   ```bat
   git clone https://github.com/pestouriealix-oss/ProjetLol.git
   cd ProjetLol
   npm install
   cd overwolf
   npm install
   set VITE_GUFO_URL=http://192.168.x.x:3000
   npm run build
   ```

4. Overwolf → Paramètres → À propos → **Development options** → **Load
   unpacked extension**, puis choisis le dossier `ProjetLol\overwolf\dist`.
5. Lance Gufo depuis le dock d'Overwolf, relie-le à ton compte, puis lance une
   partie (normale ou classée : Riot ne montre pas les parties d'entraînement).

Si une fenêtre reste vide : dans Development options, clique sur le nom de la
fenêtre pour ouvrir ses outils de développement, et copie les erreurs de la
console.

## Envoyer à Overwolf

`npm run pack` construit l'app pour `https://gufo.gg` et produit
`gufo-<version>.opk`, à joindre au formulaire de test d'Overwolf. Le site doit
être en ligne : l'app ne fait rien sans lui. La version se change dans
`package.json` et `public/manifest.json` (le paquet refuse deux numéros
différents).
