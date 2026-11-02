import { t } from "@/i18n/fr";
import { APP_NAME } from "@/lib/config";

import type { Email } from "./index";

const copy = t.emails;

/**
 * Les e-mails ne lisent pas les variables CSS du site : leurs couleurs sont
 * écrites ici, sur fond clair (lisible dans tous les logiciels de messagerie).
 */
const COLORS = { text: "#211d1a", muted: "#6b625b", line: "#e6e0da", button: "#211d1a" };

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** Un e-mail à une seule action : un bouton, et le lien en clair en dessous. */
function actionEmail(input: {
  to: string;
  name: string | null;
  subject: string;
  body: string;
  action: string;
  link: string;
  expiry: string;
}): Email {
  const greeting = copy.greeting(input.name);
  const text = [greeting, "", input.body, input.link, "", input.expiry, "", copy.footer].join("\n");

  const p = (content: string, color = COLORS.text) =>
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${color}">${content}</p>`;
  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px;background:#f6f3ef;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid ${COLORS.line};border-radius:12px;padding:28px">
      <p style="margin:0 0 24px;font-size:20px;font-weight:700;letter-spacing:0.04em;color:${COLORS.text}">${escapeHtml(APP_NAME)}</p>
      ${p(escapeHtml(greeting))}
      ${p(escapeHtml(input.body))}
      <p style="margin:24px 0">
        <a href="${escapeHtml(input.link)}" style="display:inline-block;background:${COLORS.button};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:8px">${escapeHtml(input.action)}</a>
      </p>
      ${p(escapeHtml(input.expiry), COLORS.muted)}
      <p style="margin:0 0 8px;font-size:13px;color:${COLORS.muted}">${escapeHtml(copy.linkFallback)}</p>
      <p style="margin:0 0 24px;font-size:13px;word-break:break-all"><a href="${escapeHtml(input.link)}" style="color:${COLORS.text}">${escapeHtml(input.link)}</a></p>
      <p style="margin:0;padding-top:16px;border-top:1px solid ${COLORS.line};font-size:12px;line-height:1.5;color:${COLORS.muted}">${escapeHtml(copy.footer)}</p>
    </div>
  </body>
</html>`;

  return { to: input.to, subject: input.subject, text, html };
}

export function verifyEmailMessage(to: string, name: string | null, link: string): Email {
  return actionEmail({ to, name, link, ...copy.verify });
}

export function resetPasswordMessage(to: string, name: string | null, link: string): Email {
  return actionEmail({ to, name, link, ...copy.reset });
}
