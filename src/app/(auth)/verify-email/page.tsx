import type { Metadata } from "next";

import { AuthPanel } from "@/components/auth/auth-panel";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { ErrorNotice } from "@/components/ui/notice";
import { t } from "@/i18n/fr";
import { isEmailTokenValid } from "@/lib/db/email-tokens";

export const metadata: Metadata = { title: t.auth.verify.title };

type VerifyEmailPageProps = { searchParams: Promise<{ token?: string | string[] }> };

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const valid = await isEmailTokenValid("VERIFY_EMAIL", value);

  return (
    <AuthPanel title={t.auth.verify.title}>
      {valid ? (
        <VerifyEmailForm token={value} />
      ) : (
        <ErrorNotice>{t.auth.verify.invalid}</ErrorNotice>
      )}
    </AuthPanel>
  );
}
