import type { Metadata } from "next";

import { AuthPanel } from "@/components/auth/auth-panel";
import { ExpiredLink, ResetPasswordForm } from "@/components/auth/reset-password-form";
import { t } from "@/i18n/fr";
import { isEmailTokenValid } from "@/lib/db/email-tokens";

export const metadata: Metadata = { title: t.auth.reset.title };

type ResetPasswordPageProps = { searchParams: Promise<{ token?: string | string[] }> };

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const valid = await isEmailTokenValid("RESET_PASSWORD", value);

  return (
    <AuthPanel title={t.auth.reset.title}>
      {valid ? <ResetPasswordForm token={value} /> : <ExpiredLink />}
    </AuthPanel>
  );
}
