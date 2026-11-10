import { AlertTriangle, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

import { SheetView } from "@/components/draft/sheet-view";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n/fr";

import type { AppState, SheetState } from "../core/controller";

const copy = t.companion.app.sheet;

/** Le vis-à-vis du joueur dans la draft, avec son portrait Data Dragon. */
export function opponentOf(state: AppState, sheet: SheetState) {
  if (sheet.status !== "writing" && sheet.status !== "ready") return null;
  const id = sheet.draft.enemies[sheet.draft.myRole];
  if (!id) return null;
  const champion = Object.values(state.champions ?? {}).find((each) => each.id === id);
  return { name: champion?.name ?? id, iconUrl: champion?.iconUrl ?? null };
}

/**
 * Ce que la fiche montre selon où en est le coach : la recherche de la
 * partie, l'écriture, la fiche, ou la raison de son absence. Partagé par la
 * fenêtre de l'écran de chargement et celle du bureau.
 */
export function SheetBody({
  state,
  onRetry,
  onOpenSite,
}: {
  state: AppState;
  onRetry: () => void;
  onOpenSite: (path: string) => void;
}) {
  const sheet = state.sheet;

  if (state.account.status === "signed_out") {
    return <Message title={copy.signedOut.title} body={copy.signedOut.body} />;
  }

  switch (sheet.status) {
    case "idle":
      return null;
    case "looking":
      return (
        <div role="status" className="flex items-start gap-3">
          <LoaderCircle
            aria-hidden
            className="mt-0.5 size-5 shrink-0 animate-spin text-ink-faint motion-reduce:animate-none"
          />
          <div>
            <p className="font-semibold text-ink">{copy.looking}</p>
            <p className="text-sm text-ink-muted">{copy.lookingHint}</p>
          </div>
        </div>
      );
    case "writing":
    case "ready":
      return (
        <SheetView
          sheet={sheet.sheet}
          opponent={opponentOf(state, sheet)}
          writing={sheet.status === "writing"}
        />
      );
    case "error": {
      const error = copy.errors[sheet.reason];
      const fixOnSite =
        sheet.reason === "no_account" ||
        sheet.reason === "not_owned" ||
        sheet.reason === "email_unverified";
      return (
        <Message title={error.title} body={error.body} tone="warn">
          <div className="flex flex-wrap gap-2 pt-1">
            {sheet.reason === "not_found" ||
            sheet.reason === "unavailable" ||
            sheet.reason === "busy" ||
            sheet.reason === "coach_setup" ? (
              <Button size="sm" variant="secondary" onClick={onRetry}>
                {copy.retry}
              </Button>
            ) : null}
            {fixOnSite ? (
              <Button size="sm" variant="secondary" onClick={() => onOpenSite("/settings")}>
                {t.companion.app.account.fixOnSite}
              </Button>
            ) : null}
            {sheet.reason === "quota" || sheet.reason === "budget" ? (
              <Button size="sm" variant="secondary" onClick={() => onOpenSite("/premium")}>
                {copy.seePremium}
              </Button>
            ) : null}
          </div>
          {sheet.code ? <p className="text-xs text-ink-faint">{copy.code(sheet.code)}</p> : null}
        </Message>
      );
    }
  }
}

function Message({
  title,
  body,
  tone = "neutral",
  children,
}: {
  title: string;
  body: string;
  tone?: "neutral" | "warn";
  children?: ReactNode;
}) {
  return (
    <div role={tone === "warn" ? "alert" : "status"} className="flex items-start gap-3">
      {tone === "warn" ? (
        <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-warn" />
      ) : null}
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-sm text-ink-muted">{body}</p>
        {children}
      </div>
    </div>
  );
}
