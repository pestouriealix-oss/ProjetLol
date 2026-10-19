"use client";

import { Search, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useMemo, useState } from "react";

import { ChampionIcon } from "@/components/champion/champion-icon";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { normalizeChampionName } from "@/lib/draft/champion-match";

const copy = t.draft.picker;

export type PickerChampion = { id: string; name: string; iconUrl: string };

/**
 * Choix d'un champion pour une case du tableau : une recherche (nom français
 * ou identifiant, sans souci des accents) et la grille des portraits. Les
 * champions déjà pris ailleurs dans la partie sont grisés.
 */
export function ChampionPicker({
  open,
  onOpenChange,
  title,
  champions,
  taken,
  current,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ce qu'on choisit (« Champion adverse au poste Jungle »). */
  title: string;
  champions: readonly PickerChampion[];
  /** Champions déjà placés dans une autre case. */
  taken: ReadonlySet<string>;
  current: string | null;
  /** `null` : vider la case. */
  onChoose: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const needle = normalizeChampionName(query);
    if (!needle) return champions;
    return champions.filter(
      (champion) =>
        normalizeChampionName(champion.name).includes(needle) ||
        normalizeChampionName(champion.id).includes(needle),
    );
  }, [champions, query]);

  const choose = (id: string | null) => {
    onChoose(id);
    onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery("");
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-field/75 backdrop-blur-[3px] data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in" />
        <Dialog.Content className="fixed inset-x-0 top-[8vh] z-50 mx-auto flex max-h-[84vh] w-[calc(100vw-2rem)] max-w-2xl flex-col rounded-panel border border-line-strong bg-surface shadow-lift data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in">
          <div className="flex items-start justify-between gap-4 p-5 pb-3">
            <div>
              <Dialog.Title className="display text-2xl text-ink">{copy.title}</Dialog.Title>
              <Dialog.Description className="text-sm text-ink-muted">{title}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm" aria-label={copy.close}>
                <X aria-hidden />
              </Button>
            </Dialog.Close>
          </div>

          <div className="px-5">
            <label className="relative block">
              <span className="sr-only">{copy.search}</span>
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint"
              />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  // Entrée choisit le seul (ou le premier) champion trouvé.
                  const first = shown.find((champion) => !taken.has(champion.id));
                  if (event.key === "Enter" && first && query) {
                    event.preventDefault();
                    choose(first.id);
                  }
                }}
                placeholder={copy.placeholder}
                className="h-11 w-full rounded-control border border-line-strong bg-field pr-3 pl-9 text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-accent"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 pt-4">
            {shown.length === 0 ? (
              <p className="py-6 text-center text-ink-muted">{copy.empty}</p>
            ) : (
              <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {shown.map((champion) => {
                  const isTaken = taken.has(champion.id);
                  const selected = champion.id === current;
                  return (
                    <li key={champion.id}>
                      <button
                        type="button"
                        disabled={isTaken}
                        aria-pressed={selected}
                        onClick={() => choose(champion.id)}
                        className={cn(
                          "flex w-full flex-col items-center gap-1 rounded-control p-1.5 text-center transition-colors duration-(--duration-fast)",
                          selected ? "bg-raised ring-2 ring-ink" : "hover:bg-raised",
                          isTaken && "cursor-not-allowed opacity-35",
                        )}
                      >
                        <ChampionIcon
                          name={champion.name}
                          src={champion.iconUrl}
                          className="size-12"
                        />
                        <span className="w-full truncate text-xs font-semibold text-ink-muted">
                          {champion.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {current ? (
            <div className="border-t border-line p-4">
              <Button variant="secondary" size="sm" onClick={() => choose(null)}>
                {copy.clear}
              </Button>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
