"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { readReviewView, type ReviewView as Review } from "@/lib/review/review-view";

import { FactsStrip, ReviewView } from "./review-view";

const copy = t.matchDetail.review;

type ReviewErrorKind = keyof typeof copy.errors;

type State =
  | { status: "idle" }
  | { status: "writing"; review: Review }
  | { status: "done"; review: Review }
  | { status: "error"; review: Review; error: ReviewErrorKind };

/** Erreurs qu'un nouvel essai ne règle pas : pas de bouton « Réessayer ». */
const FINAL_ERRORS: ReadonlySet<ReviewErrorKind> = new Set([
  "quota",
  "budget",
  "not_reviewable",
  "match_not_found",
  "missing_key",
]);

/**
 * Le bilan de la partie : déjà écrit, il s'affiche ; sinon un bouton le fait
 * écrire, et il s'affiche au fur et à mesure.
 */
export function ReviewPanel({
  matchId,
  initial,
  reviewable,
  coachReady,
  remaining: initialRemaining,
  limit,
}: {
  matchId: string;
  initial: Review | null;
  /** Faux pour une partie sans poste (ARAM…). */
  reviewable: boolean;
  /** Faux si la clé du modèle manque sur le serveur. */
  coachReady: boolean;
  remaining: number;
  limit: number;
}) {
  const [state, setState] = useState<State>(
    initial ? { status: "done", review: initial } : { status: "idle" },
  );
  const [remaining, setRemaining] = useState(initialRemaining);
  const abortRef = useRef<AbortController | null>(null);

  const write = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "writing", review: {} });

    let raw: unknown = {};
    let facts: unknown;
    let latest: Review = {};
    try {
      const response = await fetch(`/api/matches/${matchId}/review`, {
        method: "POST",
        signal: controller.signal,
      });
      if (!response.body) throw new Error("Réponse vide");
      if (!response.ok) {
        const failure = readEvent(await response.text());
        setState({ status: "error", review: {}, error: failure?.error ?? "unavailable" });
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
          } else if (event.type === "partial" || event.type === "done") {
            raw = event.review;
            if (event.type === "done") facts = event.facts ?? facts;
          } else {
            setState({ status: "error", review: latest, error: event.error ?? "unavailable" });
            continue;
          }
          latest = readReviewView(raw, facts);
          if (event.type === "done") {
            setState({ status: "done", review: latest });
            setRemaining((count) => Math.max(0, count - 1));
          } else {
            setState({ status: "writing", review: latest });
          }
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error);
      setState({ status: "error", review: latest, error: "unavailable" });
    }
  };

  return (
    <Panel className="flex flex-col gap-5 p-5 sm:p-6">
      <header>
        <h2 className="display text-2xl text-ink">{copy.title}</h2>
        {state.status === "idle" ? <p className="mt-1 text-ink-muted">{copy.intro}</p> : null}
      </header>

      {state.status === "idle" ? (
        <Start
          reviewable={reviewable}
          coachReady={coachReady}
          remaining={remaining}
          limit={limit}
          onStart={() => void write()}
        />
      ) : null}

      {state.status === "writing" || state.status === "done" ? (
        <ReviewView review={state.review} writing={state.status === "writing"} />
      ) : null}

      {state.status === "error" ? (
        <div className="flex flex-col items-start gap-3">
          {/* Les chiffres de la partie restent utiles même si le texte a échoué. */}
          {state.review.facts ? (
            <div className="w-full">
              <FactsStrip facts={state.review.facts} />
            </div>
          ) : null}
          <ErrorNotice>{copy.errors[state.error]}</ErrorNotice>
          {!FINAL_ERRORS.has(state.error) ? (
            <Button variant="secondary" onClick={() => void write()}>
              {copy.retry}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}

function Start({
  reviewable,
  coachReady,
  remaining,
  limit,
  onStart,
}: {
  reviewable: boolean;
  coachReady: boolean;
  remaining: number;
  limit: number;
  onStart: () => void;
}) {
  if (!reviewable) return <p className="text-ink-muted">{copy.notReviewable}</p>;
  if (!coachReady) return <p className="text-ink-muted">{copy.noKey}</p>;
  if (remaining <= 0) return <ErrorNotice>{copy.errors.quota}</ErrorNotice>;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Button onClick={onStart}>{copy.action}</Button>
      <span className="text-sm text-ink-faint">{copy.remaining(remaining, limit)}</span>
    </div>
  );
}

type StreamEvent = {
  type: "facts" | "partial" | "done" | "error";
  review?: unknown;
  facts?: unknown;
  error?: ReviewErrorKind;
};

/** Une ligne du flux du bilan ; `null` si elle est illisible. */
function readEvent(line: string): StreamEvent | null {
  if (!line.trim()) return null;
  try {
    const value: unknown = JSON.parse(line);
    if (typeof value !== "object" || value === null || !("type" in value)) return null;
    const event = value as { type: unknown; review?: unknown; facts?: unknown; error?: unknown };
    if (
      event.type !== "facts" &&
      event.type !== "partial" &&
      event.type !== "done" &&
      event.type !== "error"
    ) {
      return null;
    }
    return {
      type: event.type,
      review: event.review,
      facts: event.facts,
      error:
        typeof event.error === "string" && event.error in copy.errors
          ? (event.error as ReviewErrorKind)
          : undefined,
    };
  } catch {
    return null;
  }
}
