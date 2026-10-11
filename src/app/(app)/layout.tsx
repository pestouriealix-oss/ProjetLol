import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Entrance } from "@/components/layout/entrance";
import { LegalFooter } from "@/components/layout/legal-footer";
import { TabBar } from "@/components/layout/tab-bar";
import { requireUser } from "@/lib/auth/session";

import { signOutAction } from "./actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <Entrance className="flex min-h-dvh flex-col">
      <AppHeader user={user} signOutAction={signOutAction} />
      <main
        id="contenu"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 group-data-entering/shell:shell-rise sm:px-6 sm:py-14"
      >
        {children}
      </main>
      {/* Marge basse : la barre d'onglets du téléphone ne doit rien recouvrir. */}
      <LegalFooter className="pb-18 md:pb-0" />
      <TabBar />
    </Entrance>
  );
}
