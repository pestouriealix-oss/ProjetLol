"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  ViewTransition,
  type ReactNode,
} from "react";

import {
  removeRiotAccountAction,
  setPrimaryRiotAccountAction,
  updateRiotAccountRolesAction,
} from "@/app/(app)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorNotice } from "@/components/ui/notice";
import { Panel, SectionHeading } from "@/components/ui/panel";
import { SlotMeter } from "@/components/ui/slot-meter";
import { t } from "@/i18n/fr";
import { PLATFORMS, type Platform, type Role } from "@/lib/config";

import { AddRiotAccountForm } from "./add-riot-account-form";
import { RolePicker } from "./role-picker";

const copy = t.settings.riot;

/** Ce que l'interface a besoin de savoir d'un compte Riot, et rien de plus. */
export type RiotAccountView = {
  id: string;
  gameName: string;
  tagLine: string;
  platform: Platform;
  roles: Role[];
  isPrimary: boolean;
  verified: boolean;
};

type Change = { type: "remove"; id: string } | { type: "primary"; id: string };

/** Ce que le serveur fera de son côté, appliqué tout de suite à l'écran. */
function applyChange(accounts: RiotAccountView[], change: Change): RiotAccountView[] {
  switch (change.type) {
    case "remove": {
      const remaining = accounts.filter((account) => account.id !== change.id);
      // Le principal vient de partir : le suivant prend le relais, comme côté serveur.
      if (remaining.length > 0 && !remaining.some((account) => account.isPrimary)) {
        return remaining.map((account, index) => ({ ...account, isPrimary: index === 0 }));
      }
      return remaining;
    }
    case "primary":
      return accounts
        .map((account) => ({ ...account, isPrimary: account.id === change.id }))
        .toSorted((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  }
}

/** Vrai si les deux listes montrent les mêmes comptes dans le même ordre. */
function sameOrder(a: RiotAccountView[], b: RiotAccountView[]): boolean {
  return a.length === b.length && a.every((account, index) => account.id === b[index]?.id);
}

/** Nombre maximum d'emplacements libres dessinés sous la liste. */
const MAX_FREE_SLOTS_SHOWN = 2;

/**
 * Délai après lequel le glissement se désarme de lui-même, en millisecondes,
 * si le serveur ne l'a pas fait en confirmant la liste.
 */
const DISARM_AFTER_MS = 2500;

/**
 * Rôles d'un compte déjà lié. Cocher un rôle répond tout de suite (état local),
 * puis s'enregistre en arrière-plan. En cas d'échec, on revient au dernier état
 * enregistré.
 *
 * Après chaque enregistrement, le serveur renvoie la page avec les rôles qu'il
 * a retenus. Ils ne sont adoptés qu'au repos : pendant une série de clics
 * rapides, une réponse intermédiaire ne doit pas décocher ce qui vient d'être
 * coché. Et jamais en remontant le composant, ce qui couperait net le tracé du
 * pictogramme en cours.
 */
function AccountRoles({ account, riotId }: { account: RiotAccountView; riotId: string }) {
  const [roles, setRoles] = useState(account.roles);
  const [error, setError] = useState<string>();
  // Nombre d'enregistrements en cours : tant qu'il y en a, l'écran fait foi.
  const [saving, setSaving] = useState(0);

  const [serverRoles, setServerRoles] = useState(account.roles);
  if (account.roles !== serverRoles) {
    setServerRoles(account.roles);
    if (saving === 0) setRoles(account.roles);
  }

  // Dernier état confirmé par le serveur, pour y revenir après un échec.
  const confirmed = useRef(account.roles);
  useEffect(() => {
    confirmed.current = account.roles;
  }, [account.roles]);

  const lastRequest = useRef(0);

  const save = (next: Role[]) => {
    setRoles(next);
    setError(undefined);
    setSaving((count) => count + 1);
    const request = ++lastRequest.current;
    const settle = (failure?: string) => {
      setSaving((count) => count - 1);
      if (failure === undefined) {
        confirmed.current = next;
        return;
      }
      // Une réponse en retard ne doit pas écraser un choix plus récent.
      if (request !== lastRequest.current) return;
      setRoles(confirmed.current);
      setError(failure);
    };
    updateRiotAccountRolesAction(account.id, next).then(
      (result) => settle(result.ok ? undefined : result.error),
      () => settle(copy.errors.unknown),
    );
  };

  return (
    <RolePicker
      idPrefix={`account-${account.id}-role`}
      legend={copy.rolesFor(riotId)}
      hideLegend
      value={roles}
      onChange={save}
      error={error}
    />
  );
}

type RiotAccountsSectionProps = {
  accounts: RiotAccountView[];
  maxAccounts: number;
  /** Ce qui suit la section sur la page : glisse quand la liste change de hauteur. */
  children: ReactNode;
};

/**
 * Comptes Riot liés : la liste, la jauge d'emplacements et le formulaire d'ajout.
 *
 * Chaque geste se voit tout de suite : la liste affichée est un état local,
 * modifié dans une transition (donc animé), pendant que le serveur enregistre.
 * Quand le serveur renvoie sa liste, c'est elle qui fait foi.
 *
 * Les lignes sont des frontières de transition de vue : un compte ajouté se
 * pose, un compte retiré s'efface, et ce qui reste glisse à sa place.
 *
 * Ce glissement n'est « armé » que dans le rendu qui déplace vraiment quelque
 * chose. Laissé en permanence, il lancerait une transition de vue à chaque
 * rendu sans effet visible (une erreur de formulaire, la confirmation du
 * serveur), pendant laquelle les lignes ne répondent pas aux clics.
 */
export function RiotAccountsSection({ accounts, maxAccounts, children }: RiotAccountsSectionProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [shown, setShown] = useState(accounts);
  const [slideArmed, setSlideArmed] = useState(false);
  const [syncedAccounts, setSyncedAccounts] = useState(accounts);
  if (accounts !== syncedAccounts) {
    // Le serveur a renvoyé sa liste (ajout, ou confirmation d'un geste) : on
    // l'adopte. Si elle déplace quelque chose à l'écran, le glissement est armé
    // pour ce rendu ; si elle confirme ce qui est déjà affiché, il ne l'est pas.
    setSyncedAccounts(accounts);
    setShown(accounts);
    setSlideArmed(!sameOrder(shown, accounts));
  }

  // Sans réponse du serveur pour le désarmer, il se désarme tout seul.
  useEffect(() => {
    if (!slideArmed) return;
    const timer = setTimeout(() => setSlideArmed(false), DISARM_AFTER_MS);
    return () => clearTimeout(timer);
  }, [slideArmed]);

  const [actionError, setActionError] = useState<{ message: string; attempt: number }>();
  const [removal, setRemoval] = useState<{ open: boolean; account: RiotAccountView | null }>({
    open: false,
    account: null,
  });
  const headingRef = useRef<HTMLDivElement>(null);

  // Comptes arrivés depuis l'ouverture de la page : entourés un instant.
  const [seenIds, setSeenIds] = useState(() => new Set(accounts.map((account) => account.id)));

  const slide = slideArmed ? "shift" : "none";
  const freeSlots = Math.min(maxAccounts - shown.length, MAX_FREE_SLOTS_SHOWN);

  // Enregistrements à envoyer une fois le changement affiché.
  const queuedSaves = useRef<Array<() => Promise<void>>>([]);

  const perform = (change: Change, save: () => Promise<void>) => {
    setActionError(undefined);
    queuedSaves.current.push(save);
    startTransition(() => {
      setShown((current) => applyChange(current, change));
      setSlideArmed(true);
    });
  };

  // Le changement est à l'écran : on prévient le serveur maintenant, pas avant.
  // Lancé dans le même geste, l'appel retiendrait la transition (React regroupe
  // les transitions d'un geste avec l'action en cours) : l'animation attendrait
  // la réponse du serveur au lieu de partir tout de suite.
  useLayoutEffect(() => {
    for (const save of queuedSaves.current.splice(0)) {
      save().catch(() => {
        // L'enregistrement a échoué : on le dit et on recharge la vraie liste.
        setActionError((previous) => ({
          message: copy.errors.unknown,
          attempt: (previous?.attempt ?? 0) + 1,
        }));
        router.refresh();
      });
    }
  }, [shown, router]);

  const makePrimary = (account: RiotAccountView) =>
    perform({ type: "primary", id: account.id }, () => setPrimaryRiotAccountAction(account.id));

  const remove = (account: RiotAccountView) => {
    // La ligne et son bouton vont disparaître : le focus se replace sur la section.
    headingRef.current?.focus();
    perform({ type: "remove", id: account.id }, () => removeRiotAccountAction(account.id));
  };

  return (
    <>
      <section aria-labelledby="riot-title" className="flex flex-col gap-6">
        <div ref={headingRef} tabIndex={-1} className="rounded-control outline-none">
          <SectionHeading
            id="riot-title"
            title={copy.title}
            description={copy.description}
            aside={
              <SlotMeter
                used={shown.length}
                total={maxAccounts}
                label={copy.limit(shown.length, maxAccounts)}
              />
            }
          />
        </div>

        {actionError ? (
          <ErrorNotice attempt={actionError.attempt}>{actionError.message}</ErrorNotice>
        ) : null}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <ul className="flex flex-col gap-3">
            {shown.map((account) => {
              const riotId = `${account.gameName}#${account.tagLine}`;
              return (
                <ViewTransition
                  key={account.id}
                  enter="row-enter"
                  exit="row-exit"
                  update={slide}
                  default="none"
                >
                  <li className="relative rounded-panel border border-line bg-surface px-5 py-4">
                    {seenIds.has(account.id) ? null : (
                      // Le contour s'efface puis se retire : resté en place, il
                      // se rallumerait au moindre déplacement de la ligne.
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -inset-px animate-row-flash rounded-panel border-2 border-accent"
                        onAnimationEnd={() =>
                          setSeenIds((current) => new Set(current).add(account.id))
                        }
                      />
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <p className="min-w-0 display-name text-2xl break-words text-ink">
                        {account.gameName}
                        <span className="text-ink-faint">#{account.tagLine}</span>
                      </p>
                      <Badge>{PLATFORMS[account.platform].short}</Badge>
                      {account.isPrimary ? <Badge tone="accent">{copy.primary}</Badge> : null}
                      {account.verified ? null : (
                        <Badge tone="warn" title={copy.unverifiedHint}>
                          {copy.unverified}
                        </Badge>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        {account.isPrimary ? null : (
                          <Button variant="ghost" size="sm" onClick={() => makePrimary(account)}>
                            {copy.makePrimary}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={copy.removeLabel(riotId)}
                          onClick={() => setRemoval({ open: true, account })}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    </div>
                    <div className="pt-3">
                      <AccountRoles account={account} riotId={riotId} />
                    </div>
                  </li>
                </ViewTransition>
              );
            })}
            {/* Les places encore libres, en pointillé (deux au plus) : on voit
                ce qu'il reste sans lire la jauge. Leur clé est leur rang dans
                la liste : un compte ajouté remplace la première place libre
                sur place, sans que les autres bougent. */}
            {Array.from({ length: freeSlots }, (_, slot) => (
              <ViewTransition
                key={`place-${shown.length + slot}`}
                enter="row-enter"
                exit="row-exit"
                update={slide}
                default="none"
              >
                <li className="rounded-panel border border-dashed border-line-strong/70 px-5 py-5">
                  {shown.length === 0 && slot === 0 ? (
                    <>
                      <p className="display text-xl text-ink">{copy.emptyTitle}</p>
                      <p className="mt-1 max-w-[52ch] text-ink-muted">{copy.emptyBody}</p>
                    </>
                  ) : (
                    <p className="text-sm text-ink-faint">{copy.freeSlot}</p>
                  )}
                </li>
              </ViewTransition>
            ))}
          </ul>

          <ViewTransition update={slide} default="none">
            <Panel className="p-5">
              <h3 className="pb-4 text-lg font-semibold text-ink">{copy.addTitle}</h3>
              {shown.length < maxAccounts ? (
                <AddRiotAccountForm />
              ) : (
                <p className="text-ink-muted">{copy.errors.limitReached(maxAccounts)}</p>
              )}
            </Panel>
          </ViewTransition>
        </div>

        <ConfirmDialog
          open={removal.open}
          onOpenChange={(open) => setRemoval((current) => ({ ...current, open }))}
          title={removal.account ? copy.removeTitle(removal.account.gameName) : ""}
          body={copy.removeBody}
          confirmLabel={copy.removeConfirm}
          onConfirm={() => {
            if (removal.account) remove(removal.account);
          }}
        />
      </section>

      <ViewTransition update={slide} default="none">
        {children}
      </ViewTransition>
    </>
  );
}
