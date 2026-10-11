import { discordSignInAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n/fr";

/** Affiché uniquement quand les identifiants Discord sont configurés. */
export function DiscordButton() {
  return (
    <>
      <div className="flex items-center gap-3 text-sm text-ink-faint">
        <span aria-hidden className="h-px flex-1 bg-line" />
        {t.auth.or}
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>
      <form action={discordSignInAction}>
        <Button type="submit" variant="secondary" size="lg" className="w-full">
          {t.auth.continueWithDiscord}
        </Button>
      </form>
    </>
  );
}
