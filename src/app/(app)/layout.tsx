import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { LegalFooter } from "@/components/layout/legal-footer";
import { TabBar } from "@/components/layout/tab-bar";
import { requireUser } from "@/lib/auth/session";

import { signOutAction } from "./actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader user={user} signOutAction={signOutAction} />
      <main id="contenu" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      {/* Marge basse : la barre d'onglets du téléphone ne doit rien recouvrir. */}
      <LegalFooter className="pb-16 md:pb-0" />
      <TabBar />
    </div>
  );
}
