import { discordSignInAction, discordSignUpAction } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/i18n/fr";

/**
 * Affiché uniquement quand les identifiants Discord sont configurés. Sur la
 * page d'inscription (`signUp`), il emporte le code d'invitation du test fermé.
 */
export function DiscordButton({ signUp }: { signUp?: { inviteCode?: string } }) {
  return (
    <>
      <div className="flex items-center gap-3 text-sm text-ink-faint">
        <span aria-hidden className="h-px flex-1 bg-line" />
        {t.auth.or}
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>
      <form action={signUp ? discordSignUpAction : discordSignInAction}>
        {signUp?.inviteCode ? <input type="hidden" name="code" value={signUp.inviteCode} /> : null}
        <SubmitButton variant="secondary" size="lg" className="w-full">
          {t.auth.continueWithDiscord}
        </SubmitButton>
      </form>
    </>
  );
}
