import type { ReactNode } from "react";

import { Wordmark } from "@/components/brand/wordmark";
import { Entrance } from "@/components/layout/entrance";
import { LegalFooter } from "@/components/layout/legal-footer";
import { Link } from "@/components/ui/link";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <Entrance className="flex min-h-dvh flex-col">
      <header className="border-b border-line/70">
        <div className="mx-auto flex h-15 max-w-6xl items-center px-4 sm:px-6">
          <Link href="/" className="rounded-control">
            <Wordmark />
          </Link>
        </div>
      </header>
      <main
        id="contenu"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-14 group-data-entering/shell:shell-rise sm:px-6"
      >
        <div className="flex max-w-[66ch] flex-col gap-5">{children}</div>
      </main>
      <LegalFooter />
    </Entrance>
  );
}
