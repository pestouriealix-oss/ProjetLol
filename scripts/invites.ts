/**
 * Le test fermé, en ligne de commande :
 *
 *   npm run invites -- --create 10 --note "amis"        # 10 codes à une place
 *   npm run invites -- --create 1 --uses 50 --note "createur-x"
 *   npm run invites -- --wave 20                         # les 20 plus anciens de la liste
 *   npm run invites -- --summary
 *   npm run invites -- --founders-trial 14               # au lancement
 *
 * `--wave` crée un code par personne, lui envoie l'e-mail d'invitation (le
 * lien applique le code tout seul) et la note comme invitée. `--days N` donne
 * une date limite aux codes. `--founders-trial N` offre N jours de Premium aux
 * comptes venus par invitation qui ne les ont pas encore eus (on peut le
 * relancer après chaque vague). Lit le fichier .env (base, Resend, APP_URL).
 */
import { parseArgs } from "node:util";

import { formatInviteCode, generateInviteCode } from "@/lib/auth/invite-code";
import {
  closedTestSummary,
  createInvites,
  grantFounderTrials,
  markWaitlistInvited,
  nextWaitlistEntries,
} from "@/lib/db/invites";
import { appUrl, isEmailConfigured, sendEmail } from "@/lib/email";
import { inviteMessage } from "@/lib/email/templates";

const { values } = parseArgs({
  options: {
    create: { type: "string" },
    wave: { type: "string" },
    summary: { type: "boolean", default: false },
    uses: { type: "string", default: "1" },
    note: { type: "string" },
    days: { type: "string" },
    "founders-trial": { type: "string" },
  },
});

/* eslint-disable no-console */
function positive(name: string, raw: string | undefined, max: number): number | undefined {
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0 || value > max) {
    console.error(`--${name} doit être un entier entre 1 et ${max}.`);
    process.exit(1);
  }
  return value;
}

const create = positive("create", values.create, 500);
const wave = positive("wave", values.wave, 500);
const uses = positive("uses", values.uses, 10_000) ?? 1;
const days = positive("days", values.days, 365);
const foundersTrial = positive("founders-trial", values["founders-trial"], 90);
const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

/** Des codes tous différents (le hasard pourrait en tirer deux pareils). */
function freshCodes(count: number): string[] {
  const codes = new Set<string>();
  while (codes.size < count) codes.add(generateInviteCode());
  return [...codes];
}

async function printSummary() {
  const summary = await closedTestSummary();
  console.log("Test fermé :");
  console.log(`  Liste d'attente   ${summary.waiting} en attente, ${summary.invited} invités`);
  console.log(`  Comptes créés     ${summary.registered} avec un code`);
  console.log(`  Codes             ${summary.codes} créés, ${summary.codeUses} places utilisées`);
}

async function main() {
  if (!create && !wave && !foundersTrial && !values.summary) {
    console.error(
      "Indique --create N, --wave N, --founders-trial N ou --summary (voir l'en-tête du script).",
    );
    process.exit(1);
  }

  if (create) {
    const rows = await createInvites(freshCodes(create), {
      note: values.note ?? null,
      maxUses: uses,
      expiresAt,
    });
    console.log(`${rows.length} code(s), ${uses} place(s) chacun :\n`);
    for (const row of rows) {
      console.log(`  ${formatInviteCode(row.code)}   ${appUrl(`/register?code=${row.code}`)}`);
    }
    console.log("");
  }

  if (wave && !isEmailConfigured) {
    // Sans Resend, l'e-mail ne partirait pas mais la personne serait notée invitée.
    console.error("--wave a besoin de RESEND_API_KEY et EMAIL_FROM dans .env : rien n'est envoyé.");
    process.exit(1);
  }

  if (wave) {
    const entries = await nextWaitlistEntries(wave);
    if (entries.length === 0) console.log("Personne n'attend sur la liste.");
    let sent = 0;
    for (const entry of entries) {
      const code = generateInviteCode();
      const [invite] = await createInvites([code], {
        note: values.note ?? "liste d'attente",
        expiresAt,
      });
      if (!invite) continue;
      try {
        await sendEmail(
          inviteMessage(entry.email, formatInviteCode(code), appUrl(`/register?code=${code}`)),
        );
        await markWaitlistInvited(entry.id, invite.id);
        sent += 1;
      } catch (error) {
        // L'adresse reste sur la liste : elle repartira à la prochaine vague.
        console.error(`  Échec pour ${entry.email} :`, error);
      }
    }
    if (entries.length > 0)
      console.log(`${sent} invitation(s) envoyée(s) sur ${entries.length}.\n`);
  }

  if (foundersTrial) {
    const endsAt = new Date(Date.now() + foundersTrial * 24 * 60 * 60 * 1000);
    const granted = await grantFounderTrials(endsAt);
    console.log(
      `Premium offert jusqu'au ${endsAt.toLocaleDateString("fr-FR")} : ${granted} compte(s) fondateur(s).\n`,
    );
  }

  await printSummary();
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
