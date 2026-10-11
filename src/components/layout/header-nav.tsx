"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

import { HEADER_ITEMS, isActive } from "./nav-items";

export function HeaderNav() {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-1 md:flex">
      {HEADER_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-control px-3 py-2 text-sm font-medium transition-colors duration-(--duration-fast)",
                active ? "bg-raised text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
