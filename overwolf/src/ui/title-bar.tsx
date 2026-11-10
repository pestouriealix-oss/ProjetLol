import { Minus, X } from "lucide-react";
import type { ReactNode } from "react";

import { Wordmark } from "@/components/brand/wordmark";
import { t } from "@/i18n/fr";

const copy = t.companion.app.window;

const buttonClasses =
  "grid size-8 place-items-center rounded-control text-ink-muted transition-colors duration-(--duration-fast) hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-accent";

/**
 * La barre du haut d'une fenêtre sans cadre : on la saisit pour déplacer la
 * fenêtre ; les boutons réduisent ou ferment.
 */
export function TitleBar({
  onDrag,
  onMinimize,
  onClose,
  closeLabel = copy.close,
  children,
}: {
  onDrag?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
  closeLabel?: string;
  children?: ReactNode;
}) {
  return (
    <header
      className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-3"
      onMouseDown={(event) => {
        if (event.button === 0 && !(event.target as HTMLElement).closest("button")) onDrag?.();
      }}
    >
      <Wordmark className="text-lg" />
      <div className="min-w-0 flex-1">{children}</div>
      {onMinimize ? (
        <button
          type="button"
          className={buttonClasses}
          onClick={onMinimize}
          aria-label={copy.minimize}
        >
          <Minus aria-hidden className="size-4" />
        </button>
      ) : null}
      {onClose ? (
        <button type="button" className={buttonClasses} onClick={onClose} aria-label={closeLabel}>
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </header>
  );
}
