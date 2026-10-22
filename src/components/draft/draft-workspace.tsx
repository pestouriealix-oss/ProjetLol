"use client";

import { ImageUp, LoaderCircle, RadioTower } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  loadLiveGameDraft,
  readScreenshot,
  type LiveDraftError,
  type ReadScreenshotError,
} from "@/app/(app)/draft/new/actions";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { ErrorNotice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import type { Role } from "@/lib/config";
import { cn } from "@/lib/cn";
import {
  canAnalyse,
  duplicateChampions,
  emptyDraft,
  filledCount,
  type Draft,
} from "@/lib/draft/draft";
import {
  readSheetView,
  sheetFactsSchema,
  type SheetFacts,
  type SheetView as Sheet,
} from "@/lib/draft/sheet-view";

import { ChampionPicker, type PickerChampion } from "./champion-picker";
import { DraftBoard, type DraftSideKey } from "./draft-board";
import { SheetView } from "./sheet-view";

const copy = t.draft;

/** Largeur maximale envoyée au modèle : assez pour lire les noms, sans alourdir l'envoi. */
const MAX_WIDTH = 1600;

type ReadState =
  | { status: "idle" }
  | { status: "reading" }
  | { status: "done"; filled: number; unrecognized: number }
  | { status: "error"; error: ReadScreenshotError };

type SheetErrorKind = keyof typeof copy.analyse.errors;

type LiveState =
  | { status: "checking" }
  | { status: "waiting" }
  | { status: "found"; riotId: string }
  | { status: "no_account" }
  | { status: "stopped" }
  | { status: "error"; error: LiveDraftError };

/**
 * Intervalle entre deux recherches de la partie en cours, et durée de la
 * recherche automatique. Dix secondes : la draft arrive vite pendant
 * l'écran de chargement, pour 12 appels à Riot toutes les 2 minutes.
 */
const LIVE_POLL_MS = 10_000;
const LIVE_POLL_FOR_MS = 15 * 60_000;

type SheetState =
  | { status: "idle" }
  | { status: "writing"; sheet: Sheet }
  | { status: "done"; sheet: Sheet; id: string }
  | { status: "error"; sheet: Sheet; error: SheetErrorKind };

/**
 * La page « Nouvelle game » : la capture remplit le tableau, le joueur corrige
 * au besoin, puis le coach écrit la fiche en direct à côté.
 */
export function DraftWorkspace({
  champions,
  initialRole,
  quota,
  coachReady,
  placeholder,
}: {
  champions: readonly PickerChampion[];
  initialRole: Role;
  quota: { remaining: number; limit: number };
  /** Faux si la clé de l'API manque : on peut remplir le tableau, pas lancer le coach. */
  coachReady: boolean;
  /** Ce qu'affiche la colonne de la fiche avant la première fiche. */
  placeholder: ReactNode;
}) {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(initialRole));
  const [picking, setPicking] = useState<{ side: DraftSideKey; role: Role } | null>(null);
  const [read, setRead] = useState<ReadState>({ status: "idle" });
  const [sheet, setSheet] = useState<SheetState>({ status: "idle" });
  const [remaining, setRemaining] = useState(quota.remaining);
  const [dragging, setDragging] = useState(false);
  const [live, setLive] = useState<LiveState>({ status: "checking" });
  const liveSince = useRef<number | null>(null);
  /** Fiche à lancer d'elle-même : une seule fois, pour la draft trouvée dans la partie en cours. */
  const [autoStart, setAutoStart] = useState<Draft | null>(null);
  const autoStarted = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const byId = useMemo(
    () => new Map(champions.map((champion) => [champion.id, champion])),
    [champions],
  );
  const champion = useCallback(
    (id: string) => ({ name: byId.get(id)?.name ?? id, iconUrl: byId.get(id)?.iconUrl ?? null }),
    [byId],
  );
  const duplicates = duplicateChampions(draft);
  const ready = canAnalyse(draft) && duplicates.length === 0;
  const writing = sheet.status === "writing";

  useEffect(() => () => abortRef.current?.abort(), []);

  /** Cherche la partie en cours chez Riot ; la trouve dès l'écran de chargement. */
  const checkLive = useCallback(async () => {
    try {
      const result = await loadLiveGameDraft();
      if (!result.ok) {
        setLive({ status: "error", error: result.error });
      } else if (result.status === "found") {
        setDraft(result.draft);
        setRead({ status: "idle" });
        setSheet((current) => (current.status === "writing" ? current : { status: "idle" }));
        setLive({ status: "found", riotId: result.riotId });
        if (!autoStarted.current) {
          autoStarted.current = true;
          setAutoStart(result.draft);
        }
      } else if (result.status === "no_account") {
        setLive({ status: "no_account" });
      } else {
        liveSince.current ??= Date.now();
        const expired = Date.now() - liveSince.current > LIVE_POLL_FOR_MS;
        setLive({ status: expired ? "stopped" : "waiting" });
      }
    } catch {
      setLive({ status: "error", error: "unavailable" });
    }
  }, []);

  // Première recherche à l'ouverture, puis toutes les 20 s tant que la draft est vide.
  const empty = filledCount(draft) === 0;
  useEffect(() => {
    if (live.status !== "checking" && (live.status !== "waiting" || !empty)) return;
    // Recherche demandée : tout de suite ; sinon à l'intervalle, page visible seulement.
    const delay = live.status === "checking" ? 0 : LIVE_POLL_MS;
    const timer = window.setTimeout(() => {
      if (live.status === "checking" || document.visibilityState === "visible") void checkLive();
      else setLive({ status: "waiting" });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [live, empty, checkLive]);

  const readFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setRead({ status: "error", error: "bad_image" });
        return;
      }
      setRead({ status: "reading" });
      try {
        const form = new FormData();
        form.set("capture", await shrink(file), "capture.jpg");
        form.set("myRole", draft.myRole);
        const result = await readScreenshot(form);
        if (!result.ok) {
          setRead({ status: "error", error: result.error });
          return;
        }
        setDraft(result.draft);
        // Nouvelle draft : l'ancienne fiche ne la concerne plus.
        setSheet((current) => (current.status === "writing" ? current : { status: "idle" }));
        setRead({
          status: "done",
          filled: filledCount(result.draft),
          unrecognized: result.unrecognized,
        });
      } catch {
        setRead({ status: "error", error: "unavailable" });
      }
    },
    [draft.myRole],
  );

  // Coller une capture n'importe où sur la page (Ctrl + V).
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      const file = [...(event.clipboardData?.files ?? [])].find((item) =>
        item.type.startsWith("image/"),
      );
      if (!file) return;
      event.preventDefault();
      void readFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [readFile]);

  const analyse = async (target: Draft = draft) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSheet({ status: "writing", sheet: {} });
    // Sur téléphone, la fiche est sous le tableau : on l'amène sous les yeux.
    requestAnimationFrame(() =>
      sheetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );

    let latest: Sheet = {};
    let facts: SheetFacts | undefined;
    try {
      const response = await fetch("/api/draft/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: target }),
        signal: controller.signal,
      });
      if (!response.body) throw new Error("Réponse vide");
      if (!response.ok) {
        const failure = readEvent(await response.text());
        setSheet({ status: "error", sheet: {}, error: failure?.error ?? "unavailable" });
        return;
      }
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const event = readEvent(line);
          if (!event) continue;
          if (event.type === "facts") {
            facts = event.facts;
            latest = { ...latest, facts };
            setSheet({ status: "writing", sheet: latest });
          } else if (event.type === "partial") {
            latest = { ...readSheetView(event.sheet), facts };
            setSheet({ status: "writing", sheet: latest });
          } else if (event.type === "done" && event.id) {
            latest = { ...readSheetView(event.sheet), facts: event.facts ?? facts };
            setSheet({ status: "done", sheet: latest, id: event.id });
            setRemaining((count) => Math.max(0, count - 1));
            // La fiche a désormais sa propre adresse : un rechargement la retrouve.
            window.history.replaceState(null, "", `/draft/${event.id}`);
          } else if (event.type === "error") {
            setSheet({ status: "error", sheet: latest, error: event.error ?? "unavailable" });
          }
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error);
      setSheet({ status: "error", sheet: latest, error: "unavailable" });
    }
  };

  // Draft trouvée dans la partie en cours : la fiche part toute seule, pour
  // gagner un clic et quelques secondes de lecture pendant le chargement.
  useEffect(() => {
    if (!autoStart) return;
    const timer = window.setTimeout(() => {
      setAutoStart(null);
      const valid = canAnalyse(autoStart) && duplicateChampions(autoStart).length === 0;
      if (valid && coachReady && remaining > 0) void analyse(autoStart);
    }, 0);
    return () => window.clearTimeout(timer);
  });

  const setChampion = (side: DraftSideKey, role: Role, id: string | null) => {
    setDraft((current) => ({ ...current, [side]: { ...current[side], [role]: id } }));
  };

  const taken = useMemo(() => {
    const ids = new Set<string>();
    for (const side of ["allies", "enemies"] as const) {
      for (const [role, id] of Object.entries(draft[side])) {
        if (id && !(picking && picking.side === side && picking.role === role)) ids.add(id);
      }
    }
    return ids;
  }, [draft, picking]);

  const opponentId = draft.enemies[draft.myRole];
  const sheetVisible = sheet.status !== "idle";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex min-w-0 flex-col gap-5">
        {/* La partie en cours : la draft arrive toute seule dès l'écran de chargement. */}
        <LivePanel
          live={live}
          onCheck={() => {
            liveSince.current = Date.now();
            setLive({ status: "checking" });
          }}
        />
        <p
          aria-hidden
          className="-my-2 text-center text-xs font-semibold tracking-[0.08em] text-ink-faint uppercase"
        >
          {copy.live.or}
        </p>

        {/* La capture : coller, déposer ou choisir. */}
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) void readFile(file);
          }}
          className={cn(
            "flex flex-col gap-4 rounded-panel border border-dashed px-5 py-5 transition-colors duration-(--duration-fast) sm:flex-row sm:items-center",
            dragging ? "border-ink bg-raised" : "border-line-strong",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {read.status === "reading" ? (
              <LoaderCircle aria-hidden className="size-7 shrink-0 animate-spin text-ink-muted" />
            ) : (
              <ImageUp aria-hidden className="size-7 shrink-0 text-ink-faint" />
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-ink">
                {dragging ? copy.capture.dropHere : copy.capture.title}
              </h2>
              <p className="pt-0.5 text-ink-muted" role="status" aria-live="polite">
                {read.status === "reading"
                  ? copy.capture.reading
                  : read.status === "done"
                    ? copy.capture.read(read.filled)
                    : copy.capture.body}
              </p>
              {read.status === "done" && read.unrecognized > 0 ? (
                <p className="pt-1 text-sm text-warn">
                  {copy.capture.unrecognized(read.unrecognized)}
                </p>
              ) : null}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void readFile(file);
            }}
          />
          <Button
            variant="secondary"
            disabled={read.status === "reading" || !coachReady}
            onClick={() => fileRef.current?.click()}
            className="shrink-0"
          >
            {copy.capture.choose}
          </Button>
        </div>
        {read.status === "error" ? (
          <ErrorNotice>{copy.capture.errors[read.error]}</ErrorNotice>
        ) : null}

        <div className="flex flex-col gap-2">
          <DraftBoard
            draft={draft}
            champion={champion}
            duplicates={duplicates}
            // Rien à corriger tant que ni la partie ni une capture n'ont rempli le tableau.
            onPick={empty ? undefined : (side, role) => setPicking({ side, role })}
            onSetMine={
              empty ? undefined : (role) => setDraft((current) => ({ ...current, myRole: role }))
            }
          />
          <p className="text-sm text-ink-faint">
            {empty ? copy.board.waitingHint : copy.board.hint}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button
            size="lg"
            onClick={() => void analyse()}
            disabled={!ready || writing || remaining <= 0 || !coachReady}
          >
            {writing ? (
              <>
                <LoaderCircle aria-hidden className="animate-spin" />
                {copy.analyse.writing}
              </>
            ) : (
              copy.analyse.action
            )}
          </Button>
          <p className="text-sm text-ink-muted">
            {empty
              ? copy.analyse.waiting
              : !ready
                ? copy.analyse.needs
                : copy.analyse.remaining(remaining, quota.limit)}
          </p>
        </div>
      </div>

      <div ref={sheetRef} className="scroll-mt-24">
        <Panel className="flex flex-col gap-4 p-5">
          {sheetVisible ? (
            <>
              {sheet.status === "writing" ? (
                <p className="text-sm text-ink-muted" role="status">
                  {copy.sheet.writing}
                </p>
              ) : null}
              <SheetView
                sheet={sheet.sheet}
                writing={sheet.status === "writing"}
                opponent={opponentId ? champion(opponentId) : null}
              />
              {sheet.status === "error" ? (
                <div className="flex flex-col items-start gap-3">
                  <ErrorNotice>{copy.analyse.errors[sheet.error]}</ErrorNotice>
                  {sheet.error !== "quota" && sheet.error !== "budget" ? (
                    <Button variant="secondary" size="sm" onClick={() => void analyse()}>
                      {copy.analyse.again}
                    </Button>
                  ) : (
                    <Link
                      href="/premium"
                      className="text-sm font-semibold text-ink underline underline-offset-4"
                    >
                      {t.premium.upsell}
                    </Link>
                  )}
                </div>
              ) : null}
              {sheet.status === "done" ? (
                <p className="border-t border-line pt-3 text-sm text-ink-muted">
                  {copy.analyse.saved}{" "}
                  <Link
                    href={`/draft/${sheet.id}`}
                    className="font-semibold text-ink underline underline-offset-4"
                  >
                    {copy.analyse.openSheet}
                  </Link>
                </p>
              ) : null}
            </>
          ) : (
            placeholder
          )}
        </Panel>
      </div>

      <ChampionPicker
        open={picking !== null}
        onOpenChange={(open) => {
          if (!open) setPicking(null);
        }}
        title={
          picking
            ? copy.board.choose(
                t.roles[picking.role],
                picking.side === "allies" ? "ours" : "theirs",
              )
            : ""
        }
        champions={champions}
        taken={taken}
        current={picking ? draft[picking.side][picking.role] : null}
        onChoose={(id) => {
          if (picking) setChampion(picking.side, picking.role, id);
        }}
      />
    </div>
  );
}

/** État de la recherche de la partie en cours, avec de quoi la relancer. */
function LivePanel({ live, onCheck }: { live: LiveState; onCheck: () => void }) {
  const text =
    live.status === "checking"
      ? copy.live.checking
      : live.status === "waiting"
        ? copy.live.waiting
        : live.status === "found"
          ? copy.live.found(live.riotId)
          : live.status === "stopped"
            ? copy.live.stopped
            : live.status === "no_account"
              ? copy.live.noAccount
              : (copy.live.errors[live.error] ?? copy.live.errors.unavailable);
  return (
    <div className="flex flex-col gap-4 rounded-panel border border-line bg-surface px-5 py-5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="relative grid size-7 shrink-0 place-items-center">
          {live.status === "checking" ? (
            <LoaderCircle aria-hidden className="size-7 animate-spin text-ink-muted" />
          ) : (
            <RadioTower
              aria-hidden
              className={cn("size-7", live.status === "found" ? "text-ink" : "text-ink-faint")}
            />
          )}
          {live.status === "waiting" ? (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 size-2 animate-pulse rounded-full bg-warn motion-reduce:animate-none"
            />
          ) : null}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">{copy.live.title}</h2>
          <p className="pt-0.5 text-ink-muted" role="status" aria-live="polite">
            {text}
          </p>
        </div>
      </div>
      {live.status === "no_account" ? (
        <Button asChild variant="secondary" className="shrink-0">
          <Link href="/settings">{copy.live.settings}</Link>
        </Button>
      ) : (
        <Button
          variant="secondary"
          className="shrink-0"
          disabled={live.status === "checking"}
          onClick={onCheck}
        >
          {copy.live.check}
        </Button>
      )}
    </div>
  );
}

type StreamEvent = {
  type: "facts" | "partial" | "done" | "error";
  sheet?: unknown;
  facts?: SheetFacts;
  id?: string;
  error?: SheetErrorKind;
};

/** Une ligne du flux de la fiche ; `null` si elle est illisible. */
function readEvent(line: string): StreamEvent | null {
  if (!line.trim()) return null;
  try {
    const value: unknown = JSON.parse(line);
    if (typeof value !== "object" || value === null || !("type" in value)) return null;
    const event = value as {
      type: unknown;
      sheet?: unknown;
      facts?: unknown;
      id?: unknown;
      error?: unknown;
    };
    if (
      event.type !== "facts" &&
      event.type !== "partial" &&
      event.type !== "done" &&
      event.type !== "error"
    ) {
      return null;
    }
    const facts = sheetFactsSchema.safeParse(event.facts);
    return {
      type: event.type,
      sheet: event.sheet,
      facts: facts.success ? facts.data : undefined,
      id: typeof event.id === "string" ? event.id : undefined,
      error:
        typeof event.error === "string" && event.error in copy.analyse.errors
          ? (event.error as SheetErrorKind)
          : undefined,
    };
  } catch {
    return null;
  }
}

/** Réduit la capture dans le navigateur (JPEG, 1600 px de large au plus) avant l'envoi. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image illisible"))),
      "image/jpeg",
      0.85,
    ),
  );
}
