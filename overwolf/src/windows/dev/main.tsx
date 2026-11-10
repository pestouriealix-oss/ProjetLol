import { useSyncExternalStore, type ReactNode } from "react";

import { GufoApi } from "../../core/api";
import { Controller } from "../../core/controller";
import { WINDOWS } from "../../core/ids";
import { GUFO_URL } from "../../config";
import { mockPlatform, SAMPLE_CHAMP_SELECT } from "../../platform/mock";
import { mount } from "../../ui/mount";
import { DesktopApp } from "../desktop/desktop-app";
import { SheetWindow } from "../in-game/sheet-window";

/**
 * Banc d'essai, hors Overwolf : les deux fenêtres côte à côte et de quoi
 * jouer les étapes du client. Sert au développement sur le Mac et aux
 * captures. Il parle au vrai serveur Gufo (`VITE_GUFO_URL`, par défaut
 * http://localhost:3000 en développement).
 */
const platform = mockPlatform();
const base = import.meta.env.VITE_GUFO_URL ? GUFO_URL : "http://localhost:3000";
const controller = new Controller(platform, (getToken) => new GufoApi(base, getToken));
window.gufo = controller;
controller.start();

const STEPS: { label: string; run: () => void }[] = [
  { label: "Client fermé", run: () => platform.signals()?.launcherPhase(null) },
  { label: "Salon", run: () => platform.signals()?.launcherPhase("Lobby") },
  {
    label: "Sélection",
    run: () => {
      platform.signals()?.launcherPhase("ChampSelect");
      platform.signals()?.champSelect(SAMPLE_CHAMP_SELECT);
    },
  },
  {
    label: "Écran de chargement",
    run: () => {
      platform.signals()?.launcherPhase("InProgress");
      platform.signals()?.gameRunning(true);
    },
  },
  { label: "La partie commence", run: () => platform.signals()?.matchStarted() },
  {
    label: "Fin de partie",
    run: () => {
      platform.signals()?.gameRunning(false);
      platform.signals()?.launcherPhase("EndOfGame");
    },
  },
  { label: "Raccourci", run: () => platform.signals()?.hotkey() },
];

function Frame({
  title,
  width,
  height,
  children,
}: {
  title: string;
  width: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-xs text-ink-faint">{title}</figcaption>
      <div
        className="overflow-hidden rounded-md border border-line-strong"
        style={{ width, height }}
      >
        {children}
      </div>
    </figure>
  );
}

function Bench() {
  const sheetShown = useSyncExternalStore(platform.onWindowsChange, () =>
    platform.visible(WINDOWS.inGame),
  );
  return (
    <div className="flex h-full gap-6 overflow-auto bg-field p-6">
      <nav className="flex w-44 shrink-0 flex-col gap-2" aria-label="Étapes du client">
        {STEPS.map((step) => (
          <button
            key={step.label}
            type="button"
            onClick={step.run}
            className="rounded-control border border-line-strong px-3 py-2 text-left text-sm text-ink hover:bg-raised"
          >
            {step.label}
          </button>
        ))}
      </nav>
      <Frame title="Fenêtre de bureau" width={1000} height={640}>
        <DesktopApp controller={controller} windowActions={{}} />
      </Frame>
      <Frame title="Écran de chargement" width={460} height={720}>
        <div className="h-full bg-[radial-gradient(circle_at_30%_20%,#3a3226,#120f0c)] p-0">
          {sheetShown ? <SheetWindow controller={controller} /> : null}
        </div>
      </Frame>
    </div>
  );
}

mount(<Bench />);
