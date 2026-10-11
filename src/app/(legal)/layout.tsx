import Link from "next/link";
import type { ReactNode } from "react";

import { LegalFooter } from "@/components/layout/legal-footer";
import { Wordmark } from "@/components/layout/wordmark";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6">
          <Link href="/" className="rounded-control">
            <Wordmark />
          </Link>
        </div>
      </header>
      <main id="contenu" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex max-w-[68ch] flex-col gap-4">{children}</div>
      </main>
      <LegalFooter />
    </div>
  );
}
