import {
  CircleAlert,
  Gamepad2,
  Hourglass,
  LoaderCircle,
  MonitorPlay,
  Swords,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { ChampionIcon } from "@/components/champion/champion-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";
import { isPaidPlan } from "@/lib/auth/entitlements";
import { APP_NAME, RIOT_DISCLAIMER } from "@/lib/config";

import type { Me } from "../../core/api";
import type { AppState, Controller } from "../../core/controller";
import type { Stage } from "../../core/stage";
import { AdSlot } from "../../ui/ad-slot";
import { SheetBody } from "../../ui/sheet-body";
import { TitleBar } from "../../ui/title-bar";
import { useAppState } from "../../ui/use-app-state";

const copy = t.companion.app;

/**
 * La fenêtre de bureau : relier le compte, voir où en est le joueur, relire
 * la dernière fiche, régler l'app. La pub Overwolf vit dans la colonne de
 * droite, toujours visible et sans défilement.
 */
export function DesktopApp({
  controller,
  windowActions,
}: {
  controller: Controller;
  windowActions: { drag?: () => void; minimize?: () => void; close?: () => void };
}) {
  const state = useAppState(controller);

  return (
    <div className="flex h-full flex-col bg-canvas text-ink">
      <TitleBar
        onDrag={windowActions.drag}
        onMinimize={windowActions.minimize}
        onClose={windowActions.close}
      />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_400px] gap-6 p-6">
        <main className="flex min-h-0 flex-col gap-6 overflow-y-auto pr-1 select-text">
          <AccountArea state={state} controller={controller} />
        </main>
        <aside className="flex flex-col gap-4">
          <AdSlot />
          <p lang="en" className="text-xs text-ink-faint">
            {RIOT_DISCLAIMER}
          </p>
          <nav className="flex gap-4 text-xs text-ink-faint">
            <FooterLink onClick={() => controller.openSite("/cgu")}>{t.legal.terms}</FooterLink>
            <FooterLink onClick={() => controller.openSite("/confidentialite")}>
              {t.legal.privacy}
            </FooterLink>
          </nav>
        </aside>
      </div>
    </div>
  );
}

function FooterLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="underline-offset-4 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-accent"
    >
      {children}
    </button>
  );
}

function AccountArea({ state, controller }: { state: AppState; controller: Controller }) {
  const account = state.account;
  switch (account.status) {
    case "loading":
      return (
        <div role="status" aria-label={copy.account.loading} className="flex flex-col gap-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    case "offline":
      return (
        <Card>
          <p className="flex items-center gap-2 font-semibold text-ink">
            <CircleAlert aria-hidden className="size-5 text-warn" />
            {copy.account.offline}
          </p>
          <div>
            <Button variant="secondary" size="sm" onClick={() => void controller.refreshAccount()}>
              {copy.account.retry}
            </Button>
          </div>
        </Card>
      );
    case "signed_out":
      return <LinkPanel state={state} controller={controller} />;
    case "signed_in":
      return (
        <>
          <AccountStrip me={account.me} controller={controller} />
          <StageCard state={state} controller={controller} />
          <LastSheet state={state} controller={controller} />
          <Settings state={state} controller={controller} />
        </>
      );
  }
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`flex flex-col gap-3 rounded-panel border border-line bg-surface p-5 ${className}`}
    >
      {children}
    </section>
  );
}

// ── Liaison ────────────────────────────────────────────────────────────────

function LinkPanel({ state, controller }: { state: AppState; controller: Controller }) {
  const link = state.link;
  return (
    <section aria-labelledby="link-title" className="flex max-w-[52ch] flex-col gap-5 pt-4">
      <h1 id="link-title" className="display text-4xl text-balance text-ink">
        {copy.link.title}
      </h1>
      <p className="text-lg text-ink-muted">{copy.link.body}</p>

      {link.status === "waiting" ? (
        <Card>
          <h2 className="font-semibold text-ink">{copy.link.waitingTitle}</h2>
          <p
            aria-live="polite"
            className="display text-5xl tracking-[0.12em] whitespace-nowrap text-ink tabular select-all"
          >
            {link.userCode}
          </p>
          <p className="text-ink-muted">{copy.link.waitingBody}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => controller.openLinkPage()}>
              {copy.link.reopen}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => controller.cancelLink()}>
              {copy.link.cancel}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col items-start gap-3">
          {link.status === "expired" ? <p className="text-warn">{copy.link.expired}</p> : null}
          {link.status === "error" ? (
            <p role="alert" className="text-loss">
              {copy.link.errors[link.reason]}
            </p>
          ) : null}
          <Button
            size="lg"
            disabled={link.status === "starting"}
            onClick={() => void controller.startLink()}
          >
            {link.status === "starting" ? (
              <>
                <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
                {copy.link.starting}
              </>
            ) : link.status === "expired" ? (
              copy.link.retry
            ) : (
              copy.link.start
            )}
          </Button>
          <p className="text-sm text-ink-muted">
            {copy.link.noAccount}{" "}
            <button
              type="button"
              onClick={() => controller.openSite("/register")}
              className="font-semibold text-ink underline underline-offset-4"
            >
              {copy.link.createAccount}
            </button>
          </p>
        </div>
      )}
    </section>
  );
}

// ── Compte ─────────────────────────────────────────────────────────────────

function AccountStrip({ me, controller }: { me: Me; controller: Controller }) {
  const owned = me.accounts.filter((account) => account.owned);
  const warning = !me.coachReady
    ? copy.account.emailUnverified
    : me.accounts.length === 0
      ? copy.account.noRiotAccount
      : owned.length === 0
        ? copy.account.notOwned
        : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="display text-3xl text-ink">
          {me.name ?? me.accounts[0]?.gameName ?? APP_NAME}
        </h1>
        <Badge tone={isPaidPlan(me.plan) ? "strong" : "neutral"}>{t.plans[me.plan]}</Badge>
        {me.founder ? <Badge>{t.premium.founder.badge}</Badge> : null}
        <span className="text-sm text-ink-muted tabular">
          {copy.account.sheetsLeft(me.sheets.remaining, me.sheets.limit)}
        </span>
      </div>
      {me.accounts.length > 0 ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
          {me.accounts.map((account) => (
            <li key={`${account.gameName}#${account.tagLine}`}>
              <span className="text-ink">{account.gameName}</span>
              <span className="text-ink-faint">#{account.tagLine}</span>
              {account.owned ? null : (
                <span className="ml-1.5 text-warn">{copy.account.unconfirmed}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {warning ? (
        <div className="flex flex-wrap items-center gap-3 rounded-control border border-warn/30 bg-warn-soft px-3 py-2.5">
          <CircleAlert aria-hidden className="size-4 shrink-0 text-warn" />
          <p className="min-w-0 flex-1 text-sm text-ink">{warning}</p>
          <Button size="sm" variant="secondary" onClick={() => controller.openSite("/settings")}>
            {copy.account.fixOnSite}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// ── Étape ──────────────────────────────────────────────────────────────────

const STAGE_ICON: Record<Stage, LucideIcon> = {
  offline: Gamepad2,
  lobby: Hourglass,
  champ_select: Swords,
  loading: MonitorPlay,
  in_game: Swords,
  after_game: Trophy,
};

function StageCard({ state, controller }: { state: AppState; controller: Controller }) {
  const stage = state.stage;
  const Icon = STAGE_ICON[stage];
  const text = copy.stage[stage];
  const pick = state.champSelect;
  const champion = pick?.championKey ? state.champions?.[pick.championKey] : undefined;

  return (
    <Card>
      <div className="flex items-start gap-4">
        <Icon aria-hidden className="mt-1 size-6 shrink-0 text-ink-faint" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="display text-2xl text-ink">{text.title}</h2>
          <p className="text-ink-muted">{text.body}</p>
        </div>
      </div>

      {stage === "champ_select" && (champion || pick?.role) ? (
        <div className="flex items-center gap-3 pl-10">
          {champion ? (
            <ChampionIcon name={champion.name} src={champion.iconUrl} className="size-12" />
          ) : null}
          <p className="text-ink">
            {champion ? <span className="font-semibold">{champion.name}</span> : null}
            {champion && pick?.intent ? (
              <span className="text-ink-faint"> ({copy.stage.champ_select.hovered})</span>
            ) : null}
            {pick?.role ? (
              <span className="block text-sm text-ink-muted">{t.roles[pick.role]}</span>
            ) : null}
          </p>
        </div>
      ) : null}

      {stage === "loading" && !state.sheetVisible ? (
        <div className="pl-10">
          <Button size="sm" onClick={() => controller.showSheet()}>
            {copy.stage.loading.show}
          </Button>
        </div>
      ) : null}
      {stage === "after_game" ? (
        <div className="pl-10">
          <Button size="sm" variant="secondary" onClick={() => controller.openSite("/matches")}>
            {copy.stage.after_game.action}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

// ── Dernière fiche ─────────────────────────────────────────────────────────

function LastSheet({ state, controller }: { state: AppState; controller: Controller }) {
  const sheet = state.sheet;
  return (
    <section aria-labelledby="last-sheet" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="last-sheet" className="display text-2xl text-ink">
          {copy.lastSheet.title}
        </h2>
        {sheet.status === "ready" ? (
          <button
            type="button"
            onClick={() => controller.openSite(`/draft/${sheet.id}`)}
            className="text-sm font-semibold text-ink-muted underline underline-offset-4 hover:text-ink"
          >
            {copy.lastSheet.open}
          </button>
        ) : null}
      </div>
      {sheet.status === "idle" ? (
        <p className="text-ink-muted">{copy.lastSheet.empty}</p>
      ) : (
        <Card>
          <SheetBody
            state={state}
            onRetry={() => controller.retrySheet()}
            onOpenSite={(path) => controller.openSite(path)}
          />
        </Card>
      )}
    </section>
  );
}

// ── Réglages ───────────────────────────────────────────────────────────────

function Settings({ state, controller }: { state: AppState; controller: Controller }) {
  return (
    <section
      aria-labelledby="settings-title"
      className="flex flex-col gap-4 border-t border-line pt-6"
    >
      <h2 id="settings-title" className="display text-2xl text-ink">
        {copy.settings.title}
      </h2>
      <label className="flex cursor-pointer items-center gap-3 text-ink">
        <input
          type="checkbox"
          checked={state.autoShow}
          onChange={(event) => controller.setAutoShow(event.target.checked)}
          className="size-4 accent-ink"
        />
        {copy.settings.autoShow}
      </label>
      <div className="flex flex-col gap-1">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ink">
          {copy.settings.hotkey}
          <kbd className="rounded-control border border-line-strong px-1.5 py-0.5 text-sm font-semibold">
            {state.hotkey ?? copy.settings.hotkeyNone}
          </kbd>
        </p>
        <p className="text-sm text-ink-muted">{copy.settings.hotkeyHint}</p>
      </div>
      <div>
        <Button size="sm" variant="ghost" onClick={() => void controller.logout()}>
          {copy.account.logout}
        </Button>
      </div>
    </section>
  );
}
