import { Ticket } from "lucide-react";

import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";

const copy = t.auth.invite;

/** Le code d'invitation accepté, au-dessus du formulaire d'inscription. */
export function InviteAccepted({ code }: { code: string }) {
  return (
    <div className="flex items-start gap-3 rounded-control border border-win/40 bg-win-soft px-3 py-2.5 text-sm">
      <Ticket aria-hidden className="mt-0.5 size-4 shrink-0 text-win" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-semibold tracking-wide text-ink">{copy.accepted(code)}</p>
        <p className="text-ink-muted">{copy.acceptedHint}</p>
      </div>
      <Link
        href="/register"
        className="shrink-0 text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        {copy.otherCode}
      </Link>
    </div>
  );
}
