import { X } from "lucide-react";

import { Mark } from "@/components/brand/mark";
import { t } from "@/i18n/fr";

import type { Controller } from "../../core/controller";
import { SheetBody } from "../../ui/sheet-body";
import { useAppState } from "../../ui/use-app-state";

const copy = t.companion.app;

/**
 * La fiche posée sur l'écran de chargement : un panneau qui se lit en dix
 * secondes, à déplacer d'un glisser. Aucun pseudo, aucune pub. Elle s'efface
 * toute seule quand la partie commence.
 */
export function SheetWindow({
  controller,
  onDrag,
}: {
  controller: Controller;
  onDrag?: () => void;
}) {
  const state = useAppState(controller);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-panel border border-line-strong/70 bg-canvas/95 text-ink shadow-2xl">
      <header
        className="flex shrink-0 cursor-move items-center gap-2.5 border-b border-line px-4 py-2.5"
        onMouseDown={(event) => {
          if (event.button === 0 && !(event.target as HTMLElement).closest("button")) onDrag?.();
        }}
      >
        <Mark compact className="h-5 text-ink" />
        <h1 className="min-w-0 flex-1 display text-lg text-ink">{copy.sheet.title}</h1>
        {state.hotkey ? (
          <span className="text-xs text-ink-faint">{copy.sheet.hideWith(state.hotkey)}</span>
        ) : null}
        <button
          type="button"
          onClick={() => controller.hideSheet()}
          aria-label={copy.window.hideSheet}
          className="grid size-7 place-items-center rounded-control text-ink-muted hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X aria-hidden className="size-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 select-text">
        <SheetBody
          state={state}
          onRetry={() => controller.retrySheet()}
          onOpenSite={(path) => controller.openSite(path)}
        />
      </div>
      {state.sheet.status === "ready" ? (
        <footer className="shrink-0 border-t border-line px-4 py-2 text-xs text-ink-faint">
          {copy.sheet.onSite}
        </footer>
      ) : null}
    </div>
  );
}
