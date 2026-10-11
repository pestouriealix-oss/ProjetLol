import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";

/**
 * Choix du compte Riot affiché, quand il y en a plusieurs. Le choix vit dans
 * l'adresse (`?compte=`) : la page se partage et le bouton Retour fonctionne.
 */
export function AccountSwitcher({
  basePath,
  accounts,
  currentId,
}: {
  basePath: string;
  accounts: Array<{ id: string; gameName: string }>;
  currentId: string;
}) {
  if (accounts.length < 2) return null;
  return (
    <nav aria-label={t.dashboard.accounts} className="flex rounded-control bg-field p-1">
      {accounts.map((account) => {
        const current = account.id === currentId;
        return (
          <Link
            key={account.id}
            href={`${basePath}?compte=${account.id}`}
            aria-current={current ? "true" : undefined}
            scroll={false}
            className={cn(
              "max-w-40 truncate rounded-[5px] px-3 display-name text-lg leading-8 transition-colors duration-(--duration-fast) ease-(--ease-out)",
              current ? "bg-raised text-ink shadow-key" : "text-ink-muted hover:text-ink",
            )}
          >
            {account.gameName}
          </Link>
        );
      })}
    </nav>
  );
}
