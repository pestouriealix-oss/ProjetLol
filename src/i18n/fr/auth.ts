import { APP_NAME } from "@/lib/config";

/** Connexion, inscription, mot de passe oublié, confirmation d'adresse et e-mails. */
export const auth = {
  headline: "Ton plan de jeu, avant la fin du chargement.",
  pitch:
    "Ta draft arrive toute seule, ta fiche se lit en dix secondes. Après la partie, le coach te dit ce qui a marché et quoi travailler à la suivante.",
  loginTitle: "Connexion",
  registerTitle: "Créer un compte",
  email: "E-mail",
  password: "Mot de passe",
  passwordHint: "8 caractères minimum.",
  name: "Pseudo",
  nameHint: "Facultatif. Affiché dans l'application.",
  signIn: "Se connecter",
  createAccount: "Créer mon compte",
  continueWithDiscord: "Continuer avec Discord",
  or: "ou",
  noAccount: "Pas encore de compte ?",
  hasAccount: "Déjà un compte ?",
  goToRegister: "Créer un compte",
  goToLogin: "Se connecter",
  forgotLink: "Mot de passe oublié ?",
  goToInvite: "S'inscrire sur invitation",
  invite: {
    closedTitle: "Gufo est en test fermé",
    closedIntro:
      "On ouvre par petites vagues pour bien accompagner chaque joueur. Tu as un code d'invitation ? Entre-le. Sinon, laisse ton e-mail : on t'écrit dès que ta place est prête.",
    code: "Code d'invitation",
    codeHint: "8 caractères, reçus par e-mail ou d'un créateur.",
    useCode: "Utiliser ce code",
    accepted: (code: string) => `Invitation ${code}`,
    acceptedHint: "Ton code est valable. Crée ton compte pour l'utiliser.",
    otherCode: "Changer de code",
    invalid: "Ce code n'existe pas ou a déjà servi. Vérifie-le, ou rejoins la liste d'attente.",
    required:
      "L'inscription se fait sur invitation pendant le test fermé. Rejoins la liste d'attente : on t'écrit dès que ta place est prête.",
    waitlistTitle: "Rejoindre la liste d'attente",
    consent:
      "J'accepte qu'on m'écrive pour m'inviter au test, puis pour le lancement. Rien d'autre, et l'adresse n'est jamais transmise.",
    privacy: "Confidentialité",
    join: "Rejoindre la liste",
    joined: "C'est noté ! On t'écrit dès que ta place est prête.",
    already: "Tu es déjà sur la liste : on t'écrit dès que ta place est prête.",
    consentRequired: "Coche la case pour qu'on puisse t'écrire.",
  },
  forgot: {
    title: "Mot de passe oublié",
    intro:
      "Donne l'adresse de ton compte : on t'envoie un lien pour choisir un nouveau mot de passe.",
    submit: "Recevoir le lien",
    sent: "Si un compte utilise cette adresse, un e-mail vient de partir. Pense à regarder dans les indésirables.",
    back: "Revenir à la connexion",
  },
  reset: {
    title: "Nouveau mot de passe",
    password: "Nouveau mot de passe",
    submit: "Enregistrer le mot de passe",
    invalid: "Ce lien a expiré ou a déjà servi. Demande-en un nouveau.",
    again: "Demander un nouveau lien",
    done: "Mot de passe changé. Connecte-toi avec le nouveau.",
  },
  verify: {
    title: "Confirme ton adresse",
    intro: "Un clic, et le coach est débloqué.",
    submit: "Confirmer mon adresse",
    done: "Adresse confirmée. Le coach est à toi.",
    invalid:
      "Ce lien a expiré ou a déjà servi. Tu peux en recevoir un nouveau depuis le bandeau de l'application.",
    toDashboard: "Aller au tableau de bord",
  },
  verifyBanner: {
    body: (email: string) =>
      `Confirme ton adresse : on a envoyé un lien à ${email}. Sans ça, le coach reste fermé.`,
    resend: "Renvoyer l'e-mail",
    resent: "E-mail renvoyé.",
    tooMany: "Déjà renvoyé plusieurs fois. Réessaie dans une heure.",
    failed: "L'e-mail n'a pas pu partir. Réessaie dans un instant.",
  },
  errors: {
    invalidCredentials: "E-mail ou mot de passe incorrect.",
    emailTaken: "Un compte existe déjà avec cet e-mail. Connecte-toi à la place.",
    emailInvalid: "Saisis une adresse e-mail valide.",
    passwordTooShort: "Le mot de passe doit faire au moins 8 caractères.",
    passwordTooLong: "Le mot de passe ne peut pas dépasser 128 caractères.",
    nameTooLong: "Le pseudo ne peut pas dépasser 32 caractères.",
    oauth: "La connexion avec Discord a échoué. Réessaie.",
    unknown: "La connexion a échoué. Réessaie dans un instant.",
    unavailable: "Le service ne répond pas pour l'instant. Réessaie dans un instant.",
    tooManyAttempts: "Trop de tentatives. Réessaie dans quelques minutes.",
  },
  howItWorks: {
    title: "Comment ça marche",
    steps: [
      {
        when: "Écran de chargement",
        title: "Ta draft se remplit seule",
        body: `${APP_NAME} récupère les dix champions dès le chargement. En sélection, une capture d'écran suffit : rien à recopier.`,
      },
      {
        when: "Avant la première minute",
        title: "Lis ta fiche",
        body: "Ton duel, comment ton équipe gagne, quand forcer. Plusieurs options : c'est toi qui choisis.",
      },
      {
        when: "Après la partie",
        title: "Reçois ton bilan",
        body: "Tes chiffres face à ton vis-à-vis, ce qui a marché, et un seul objectif à vérifier dès la game suivante.",
      },
    ],
    you: "Toi",
    options: ["Envahir", "Protéger", "Pousser"],
    focus: "Objectif",
  },
  pricing: (sheets: number, reviews: number, price: string) =>
    `Gratuit pour commencer : ${sheets} fiches et ${reviews} bilans par jour. Premium à ${price} par mois, sans engagement.`,
} as const;

export const emails = {
  greeting: (name: string | null) => (name ? `Salut ${name},` : "Salut,"),
  linkFallback: "Si le bouton ne marche pas, copie ce lien dans ton navigateur :",
  footer: `Tu reçois cet e-mail parce qu'un compte ${APP_NAME} utilise cette adresse. Si ce n'est pas toi, ignore-le : rien ne se passera.`,
  verify: {
    subject: `Confirme ton adresse ${APP_NAME}`,
    body: "Un clic pour confirmer ton adresse e-mail et débloquer le coach : fiches de draft et bilans de partie.",
    action: "Confirmer mon adresse",
    expiry: "Le lien est valable 48 heures.",
  },
  invite: {
    subject: `Ta place au test fermé de ${APP_NAME} est prête`,
    body: (code: string) =>
      `Tu étais sur la liste d'attente : ta place au test fermé est prête. Ton code d'invitation : ${code}. Le bouton l'applique tout seul.`,
    action: "Créer mon compte",
    expiry: "Le code ne sert qu'une fois. Garde-le pour toi.",
    footer: `Tu reçois cet e-mail parce que tu t'es inscrit sur la liste d'attente de ${APP_NAME}.`,
  },
  reset: {
    subject: `Ton nouveau mot de passe ${APP_NAME}`,
    body: "Tu as demandé un nouveau mot de passe. Choisis-le ici :",
    action: "Choisir un nouveau mot de passe",
    expiry:
      "Le lien est valable 30 minutes. Si tu n'as rien demandé, ignore cet e-mail : ton mot de passe ne change pas.",
  },
} as const;
