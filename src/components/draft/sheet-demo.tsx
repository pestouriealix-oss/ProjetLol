"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { MiniMap } from "@/components/map/mini-map";
import { RoleGlyph } from "@/components/map/role-glyph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { t } from "@/i18n/fr";
import { prefersReducedMotion } from "@/lib/motion";

import { DEMO_PLANS, DEMO_POWER, DEMO_ROUTES, type DemoPlanId } from "./demo";
import { PowerCurve } from "./power-curve";
import { Streamed } from "./streamed";
import { TeamMark, ThreatMark } from "./team-mark";

const copy = t.sheet;

/**
 * Partition de l'entrée en scène, en millisecondes depuis l'affichage.
 * La fiche s'écrit de haut en bas, dans l'ordre où on la lit : qui je joue,
 * comment on gagne, où aller, quand, et de quoi se méfier.
 */
const AT = {
  title: 0,
  versus: 180,
  winOurs: 420,
  winTheirs: 720,
  map: 900,
  plans: 1100,
  planSteps: 1300,
  curve: 1900,
  threat: 2700,
} as const;

/** Une fois l'entrée jouée, un changement de plan s'écrit presque aussitôt. */
const PLAN_SWITCH_DELAY = 120;

const delay = (ms: number) => ({ "--intro-delay": `${ms}ms` }) as CSSProperties;

/**
 * La fiche de draft, en démonstration sur l'écran de connexion.
 *
 * Un seul moment orchestré : au chargement, la fiche s'écrit comme elle le
 * fera pendant une vraie sélection des champions. Ensuite plus rien ne bouge
 * tout seul ; la carte et la courbe répondent aux gestes.
 *
 * L'entrée en scène est en CSS pur (elle se joue même sans JavaScript).
 * Changer la clé du contenu le remonte, ce qui la rejoue.
 */
export function SheetDemo() {
  const figureRef = useRef<HTMLElement>(null);
  const [intro, setIntro] = useState({ run: 0, done: false });
  const [planId, setPlanId] = useState<DemoPlanId>("invade");
  const plan = DEMO_PLANS.find((candidate) => candidate.id === planId) ?? DEMO_PLANS[0];

  // Sur téléphone la fiche est sous le formulaire : son entrée s'est jouée
  // hors de l'écran. On la rejoue une fois, quand elle arrive sous les yeux.
  useEffect(() => {
    const figure = figureRef.current;
    if (!figure || prefersReducedMotion()) return;

    let startedOffscreen = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (!entry.isIntersecting) {
          startedOffscreen = true;
          return;
        }
        if (startedOffscreen) setIntro((current) => ({ run: current.run + 1, done: false }));
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    observer.observe(figure);
    return () => observer.disconnect();
  }, []);

  const choosePlan = (next: DemoPlanId) => {
    setPlanId(next);
    setIntro((current) => ({ ...current, done: true }));
  };

  return (
    <figure ref={figureRef} className="w-full max-w-[31rem]">
      <figcaption className="flex items-center justify-between gap-3 pb-2">
        <span className="text-sm text-ink-faint">{copy.demoLabel}</span>
        <Button
          variant="ghost"
          size="sm"
          className="motion-reduce:hidden"
          onClick={() => setIntro((current) => ({ run: current.run + 1, done: false }))}
        >
          <RotateCcw aria-hidden />
          {copy.replay}
        </Button>
      </figcaption>

      {/* Conteneur de référence : la mise en page de la fiche dépend de sa
          propre largeur, pas de celle de l'écran. */}
      <div
        key={intro.run}
        className="@container overflow-hidden rounded-sheet border border-line bg-surface shadow-lift"
      >
        <header className="px-5 pt-5 pb-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="display-name text-3xl text-ink">
              <Streamed text={copy.champion} delay={AT.title} step={70} />
            </p>
            <Badge tone="accent" className="intro-fade" style={delay(AT.title + 160)}>
              <RoleGlyph role="JUNGLE" className="size-3.5" />
              {t.roles.JUNGLE}
            </Badge>
          </div>
          <p className="pt-1 text-ink-muted">
            <Streamed text={copy.versus} delay={AT.versus} />
          </p>
        </header>

        <ul className="flex flex-col gap-2 border-t border-line px-5 py-4">
          <li className="flex gap-2.5">
            <TeamMark side="ours" className="mt-[0.45em] intro-pop" style={delay(AT.winOurs)} />
            <p className="text-ink-muted">
              <strong className="font-semibold text-ink">
                <Streamed text={copy.win.ours} delay={AT.winOurs} />
              </strong>{" "}
              <Streamed text={copy.win.oursText} delay={AT.winOurs + 80} />
            </p>
          </li>
          <li className="flex gap-2.5">
            <TeamMark side="theirs" className="mt-[0.45em] intro-pop" style={delay(AT.winTheirs)} />
            <p className="text-ink-muted">
              <strong className="font-semibold text-ink">
                <Streamed text={copy.win.theirs} delay={AT.winTheirs} />
              </strong>{" "}
              <Streamed text={copy.win.theirsText} delay={AT.winTheirs + 80} />
            </p>
          </li>
        </ul>

        {/* Carte et plans côte à côte si la fiche est assez large, sinon empilés. */}
        <div className="grid gap-x-5 gap-y-4 border-t border-line px-5 py-4 @md:grid-cols-[13rem_minmax(0,1fr)]">
          <MiniMap
            label={plan.map}
            showTeams
            me="JUNGLE"
            threat="ADC"
            routes={DEMO_ROUTES}
            activeRouteId={planId}
            introDelay={AT.map}
            introDone={intro.done}
            className="@max-md:mx-auto @max-md:max-w-60"
          />
          <div className="flex flex-col gap-3">
            <div className="intro-fade" style={delay(AT.plans)}>
              <Segmented
                name="demo-plan"
                legend={copy.plans.legend}
                options={DEMO_PLANS.map(({ id, label }) => ({ value: id, label }))}
                value={planId}
                onChange={choosePlan}
              />
            </div>
            {/* Hauteur réservée : passer d'un plan à l'autre ne décale rien. */}
            <ul key={planId} className="flex min-h-18 flex-col gap-1.5">
              {plan.steps.map((step, index) => (
                <li key={step} className="flex gap-2.5 text-ink">
                  <span
                    aria-hidden
                    className="mt-[0.5em] h-2.5 w-1 shrink-0 -skew-x-[14deg] intro-fade rounded-[1px] bg-accent"
                    style={delay((intro.done ? PLAN_SWITCH_DELAY : AT.planSteps) + index * 220)}
                  />
                  <span>
                    <Streamed
                      text={step}
                      delay={(intro.done ? PLAN_SWITCH_DELAY : AT.planSteps) + index * 220}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-line px-5 pt-4 pb-3">
          <PowerCurve series={DEMO_POWER} introDelay={AT.curve} />
        </div>

        <p className="flex gap-2.5 border-t border-line px-5 py-4">
          <ThreatMark className="mt-[0.4em] intro-pop" style={delay(AT.threat)} />
          <span className="text-ink-muted">
            <strong className="font-semibold text-warn">
              <Streamed text={copy.threat.label} delay={AT.threat} />
            </strong>{" "}
            <Streamed text={copy.threat.text} delay={AT.threat + 80} />
          </span>
        </p>
      </div>
    </figure>
  );
}
