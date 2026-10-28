"use client";

import { RoleGlyph } from "@/components/map/role-glyph";
import { t } from "@/i18n/fr";
import { MAX_ROLES_PER_ACCOUNT, ROLES, type Role } from "@/lib/config";
import { cn } from "@/lib/cn";

type RolePickerProps = {
  /** Préfixe des identifiants, unique sur la page. */
  idPrefix: string;
  legend: string;
  /** Masque la légende visuellement (elle reste lue par les lecteurs d'écran). */
  hideLegend?: boolean;
  /** Nom du champ, pour un envoi par formulaire. */
  name?: string;
  value: readonly Role[];
  onChange: (roles: Role[]) => void;
  disabled?: boolean;
  hint?: string;
  error?: string;
};

/**
 * Choix des rôles principaux : des cases à cocher présentées comme des
 * pastilles. Cocher un rôle trace sa voie sur le pictogramme ; une fois le
 * maximum atteint, les rôles restants s'estompent.
 */
export function RolePicker({
  idPrefix,
  legend,
  hideLegend = false,
  name,
  value,
  onChange,
  disabled = false,
  hint,
  error,
}: RolePickerProps) {
  const full = value.length >= MAX_ROLES_PER_ACCOUNT;
  const messageId = error || hint ? `${idPrefix}-message` : undefined;

  const toggle = (role: Role, checked: boolean) => {
    const next = checked ? [...value, role] : value.filter((current) => current !== role);
    onChange(ROLES.filter((candidate) => next.includes(candidate)));
  };

  return (
    <fieldset aria-describedby={messageId} className="flex min-w-0 flex-col">
      <legend className={cn("pb-2 text-sm font-semibold text-ink", hideLegend && "sr-only")}>
        {legend}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {ROLES.map((role) => {
          const checked = value.includes(role);
          const inputId = `${idPrefix}-${role}`;
          return (
            <div key={role}>
              <input
                id={inputId}
                type="checkbox"
                name={name}
                value={role}
                checked={checked}
                disabled={disabled || (full && !checked)}
                onChange={(event) => toggle(role, event.target.checked)}
                className="peer sr-only"
              />
              <label
                htmlFor={inputId}
                className={cn(
                  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-pill border pr-3.5 pl-2.5 text-sm font-semibold select-none",
                  "[transition:scale_var(--duration-slow)_var(--ease-spring),color_var(--duration-fast)_var(--ease-out),border-color_var(--duration-fast)_var(--ease-out),background-color_var(--duration-fast)_var(--ease-out),opacity_var(--duration-base)_var(--ease-out)]",
                  "active:scale-[0.94] active:[transition-duration:var(--duration-press)]",
                  // L'état coché est posé ici plutôt qu'avec `peer-checked` : au
                  // survol, les styles de survol l'emporteraient sur lui. Craie,
                  // pas corail : c'est un choix du joueur, pas un conseil du coach.
                  checked
                    ? "border-ink bg-ink/10 text-ink"
                    : "border-line-strong text-ink-muted hover:border-ink-faint hover:text-ink",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
                  "peer-disabled:cursor-not-allowed peer-disabled:opacity-40 peer-disabled:hover:border-line-strong peer-disabled:hover:text-ink-muted peer-disabled:active:scale-100",
                )}
              >
                <RoleGlyph role={role} active={checked} />
                {t.roles[role]}
              </label>
            </div>
          );
        })}
      </div>
      {error ? (
        <p id={messageId} className="pt-1.5 text-sm text-loss">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="pt-1.5 text-sm text-ink-faint">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}
