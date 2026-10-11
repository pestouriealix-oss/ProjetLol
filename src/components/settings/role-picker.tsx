"use client";

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
 * pastilles. Une fois le maximum atteint, les rôles restants se grisent.
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
    <fieldset aria-describedby={messageId} className="flex min-w-0 flex-col gap-1.5">
      <legend className={cn("mb-1.5 text-sm font-medium text-ink", hideLegend && "sr-only")}>
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
                  "inline-flex h-8 cursor-pointer items-center rounded-pill border px-3 text-sm font-medium select-none",
                  "border-line-strong text-ink-muted transition-colors duration-(--duration-fast) hover:border-ink-faint hover:text-ink",
                  "peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
                  "peer-disabled:cursor-not-allowed peer-disabled:opacity-40 peer-disabled:hover:border-line-strong peer-disabled:hover:text-ink-muted",
                )}
              >
                {t.roles[role]}
              </label>
            </div>
          );
        })}
      </div>
      {error ? (
        <p id={messageId} className="text-sm text-loss">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-sm text-ink-faint">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}
