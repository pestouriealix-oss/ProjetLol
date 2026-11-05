"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { confirmOwnershipAction, startOwnershipAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { ErrorNotice, SuccessNotice } from "@/components/ui/notice";
import { t } from "@/i18n/fr";
import { formatTime } from "@/lib/format";

const copy = t.settings.riot.ownership;

/** Le temps de lire la confirmation avant que la ligne ne se mette à jour. */
const REFRESH_AFTER_MS = 2000;

export type OwnershipChallengeView = {
  iconId: number;
  iconUrl: string | null;
  /** Date ISO. */
  expiresAt: string;
};

/**
 * Prouver qu'un compte est le sien : le site demande une icône de départ,
 * le joueur la met dans le client du jeu, puis le site vérifie chez Riot.
 * Une preuve déjà demandée (la page a été rechargée) reprend où elle en était.
 */
export function OwnershipCheck({
  accountId,
  pending,
}: {
  accountId: string;
  pending: OwnershipChallengeView | null;
}) {
  const router = useRouter();
  const [challenge, setChallenge] = useState(pending);
  const [busy, setBusy] = useState<"start" | "check" | null>(null);
  const [error, setError] = useState<{ message: string; attempt: number; restart: boolean }>();
  const [done, setDone] = useState(false);

  const fail = (message: string, restart = false) =>
    setError((previous) => ({ message, attempt: (previous?.attempt ?? 0) + 1, restart }));

  const start = async () => {
    setBusy("start");
    setError(undefined);
    try {
      const result = await startOwnershipAction(accountId);
      if (!result.ok) return fail(result.error);
      if (result.status === "owned") {
        setDone(true);
        setTimeout(() => router.refresh(), REFRESH_AFTER_MS);
        return;
      }
      setChallenge({
        iconId: result.iconId,
        iconUrl: result.iconUrl,
        expiresAt: result.expiresAt,
      });
    } catch {
      fail(copy.errors.unavailable);
    } finally {
      setBusy(null);
    }
  };

  const check = async () => {
    setBusy("check");
    setError(undefined);
    try {
      const result = await confirmOwnershipAction(accountId);
      if (!result.ok) {
        if (result.restart) setChallenge(null);
        return fail(result.error, result.restart);
      }
      setDone(true);
      setTimeout(() => router.refresh(), REFRESH_AFTER_MS);
    } catch {
      fail(copy.errors.unavailable);
    } finally {
      setBusy(null);
    }
  };

  if (done) return <SuccessNotice>{copy.done}</SuccessNotice>;

  if (!challenge) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-control border border-warn/30 bg-warn-soft px-4 py-3">
          <p className="max-w-[56ch] text-sm text-ink">{copy.why}</p>
          <Button size="sm" variant="secondary" pending={busy === "start"} onClick={start}>
            {error?.restart ? copy.restart : copy.start}
          </Button>
        </div>
        {error ? <ErrorNotice attempt={error.attempt}>{error.message}</ErrorNotice> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-control border border-line-strong bg-raised p-4">
      <div className="flex gap-4">
        <StarterIcon iconId={challenge.iconId} src={challenge.iconUrl} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{copy.title}</p>
          <span className="sr-only">{copy.iconLabel(challenge.iconId)}</span>
          <ol className="mt-1.5 flex list-decimal flex-col gap-1 pl-4 text-sm text-ink-muted marker:text-ink-faint">
            {copy.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" pending={busy === "check"} onClick={check}>
          {copy.check}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setChallenge(null)}>
          {copy.later}
        </Button>
        <p className="text-xs text-ink-faint tabular">
          {copy.until(formatTime(new Date(challenge.expiresAt)))}
        </p>
      </div>
      {error ? <ErrorNotice attempt={error.attempt}>{error.message}</ErrorNotice> : null}
    </div>
  );
}

/** L'icône demandée (Data Dragon) ; sans image, son numéro tient la place. */
function StarterIcon({ iconId, src }: { iconId: number; src: string | null }) {
  const [failed, setFailed] = useState(false);
  const box = "size-16 shrink-0 overflow-hidden rounded-control border border-line-strong bg-field";
  if (!src || failed) {
    return (
      <span
        aria-hidden
        className={`${box} flex items-center justify-center display text-2xl text-ink`}
      >
        {iconId}
      </span>
    );
  }
  return (
    <span className={box}>
      {/* Servie telle quelle par Riot : déjà petite, inutile de la retraiter. */}
      <Image
        src={src}
        alt=""
        width={128}
        height={128}
        unoptimized
        className="size-full object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
