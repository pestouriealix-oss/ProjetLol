import type { Metadata } from "next";

import { AuthPanel, authLinkClasses } from "@/components/auth/auth-panel";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";

export const metadata: Metadata = { title: t.auth.forgot.title };

export default function ForgotPasswordPage() {
  return (
    <AuthPanel title={t.auth.forgot.title}>
      <ForgotPasswordForm />
      <p className="text-ink-muted">
        <Link href="/login" className={authLinkClasses}>
          {t.auth.forgot.back}
        </Link>
      </p>
    </AuthPanel>
  );
}
