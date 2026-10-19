import { Link } from "@/components/ui/link";
import { cn } from "@/lib/cn";

/**
 * Quelques vues d'une même page, sous forme de liens : le choix vit dans
 * l'adresse, la page se partage et le bouton Retour fonctionne.
 */
export function TabLinks({
  label,
  items,
  current,
  className,
}: {
  label: string;
  items: readonly { key: string; label: string; href: string }[];
  current: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("w-fit max-w-full", className)}>
      <ul className="flex gap-1 overflow-x-auto rounded-control bg-field p-1">
        {items.map((item) => {
          const active = item.key === current;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center rounded-[5px] px-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-(--duration-fast) ease-(--ease-out)",
                  active ? "bg-raised text-ink shadow-key" : "text-ink-muted hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
