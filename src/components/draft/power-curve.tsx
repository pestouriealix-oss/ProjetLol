"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { GAME_PHASES } from "@/lib/draft/phases";
import {
  advantageAt,
  createPowerCurves,
  findCrossovers,
  samplePowerCurves,
  type Advantage,
  type PowerSeries,
} from "@/lib/draft/power-curve";
import { tween } from "@/lib/motion";

import { TeamMark } from "./team-mark";

const copy = t.sheet.curve;

/** Repère du graphique, en unités SVG. */
const WIDTH = 320;
const HEIGHT = 116;
const PLOT = { left: 4, right: 316, top: 16, bottom: 104 };

/** Largeur approximative d'une étiquette de courbe, en minutes de jeu. */
const LABEL_SPAN_MINUTES = 7;

const KEY_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowDown: -1,
  ArrowRight: 1,
  ArrowUp: 1,
  PageDown: -5,
  PageUp: 5,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Minute de jeu vers abscisse du graphique. */
const toX = (minute: number, from: number, to: number) =>
  PLOT.left + ((minute - from) / (to - from)) * (PLOT.right - PLOT.left);
/** Force (0 à 100) vers ordonnée du graphique. */
const toY = (power: number) => PLOT.bottom - (power / 100) * (PLOT.bottom - PLOT.top);
const percent = (value: number, total: number) => `${(value / total) * 100}%`;
const delay = (ms: number) => ({ "--intro-delay": `${Math.round(ms)}ms` }) as CSSProperties;

function advantageLabel({ leader, strength }: Advantage): string {
  if (leader === "even") return copy.advantage.even;
  if (leader === "ours") {
    return strength === "clear" ? copy.advantage.oursClear : copy.advantage.oursSlight;
  }
  return strength === "clear" ? copy.advantage.theirsClear : copy.advantage.theirsSlight;
}

type PowerCurveProps = {
  series: PowerSeries;
  /** Délai avant que les courbes se dévoilent, en millisecondes. */
  introDelay?: number;
};

/**
 * Courbe de puissance : qui est le plus fort, et à quel moment.
 *
 * Elle se lit sans y toucher (deux courbes, la zone où l'on mène en corail, le
 * moment de bascule annoncé en clair). Elle s'explore aussi : au survol, au
 * doigt ou au clavier, un repère suit la minute choisie et dit qui a
 * l'avantage. Quand on le lâche, il revient se poser sur la bascule.
 */
export function PowerCurve({ series, introDelay = 0 }: PowerCurveProps) {
  const curves = useMemo(() => createPowerCurves(series), [series]);
  const { from, to } = curves;

  const x = (minute: number) => toX(minute, from, to);
  const y = toY;

  const shapes = useMemo(() => {
    const samples = samplePowerCurves(curves, 0.5).map((sample) => ({
      x: toX(sample.minute, from, to).toFixed(1),
      ours: toY(sample.ours),
      theirs: toY(sample.theirs),
    }));
    const line = (key: "ours" | "theirs") =>
      samples.map((point, i) => `${i ? "L" : "M"}${point.x} ${point[key].toFixed(1)}`).join(" ");
    // Notre fenêtre : la surface entre les courbes là où nous sommes au-dessus.
    // Ailleurs les deux bords se confondent et la surface est nulle.
    const lowerEdge = samples
      .toReversed()
      .map((point) => `L${point.x} ${Math.max(point.ours, point.theirs).toFixed(1)}`)
      .join(" ");
    return { ours: line("ours"), theirs: line("theirs"), window: `${line("ours")} ${lowerEdge} Z` };
  }, [curves, from, to]);

  // Les étiquettes se posent au-dessus du point le plus haut de leur courbe
  // sur la largeur qu'elles occupent, pour ne jamais la chevaucher.
  const labelTops = useMemo(() => {
    const highest = (key: "ours" | "theirs", start: number, end: number) =>
      Math.min(
        ...samplePowerCurves(curves, 0.5)
          .filter((sample) => sample.minute >= start && sample.minute <= end)
          .map((sample) => toY(sample[key])),
      );
    return {
      ours: highest("ours", from, from + LABEL_SPAN_MINUTES),
      theirs: highest("theirs", to - LABEL_SPAN_MINUTES, to),
    };
  }, [curves, from, to]);

  const hatchId = useId();
  const crossovers = useMemo(() => findCrossovers(curves), [curves]);
  const restMinute = crossovers[0] ?? (from + to) / 2;

  // `null` : le repère est au repos, posé sur la bascule.
  const [scrubMinute, setScrubMinute] = useState<number | null>(null);
  const minute = scrubMinute ?? restMinute;
  const stopReturn = useRef<() => void>(() => {});

  useEffect(() => {
    const stop = stopReturn;
    return () => stop.current();
  }, []);

  const moveTo = (next: number) => {
    stopReturn.current();
    setScrubMinute(clamp(next, from, to));
  };

  const release = () => {
    stopReturn.current();
    if (scrubMinute === null) return;
    stopReturn.current = tween(scrubMinute, restMinute, (value, done) =>
      setScrubMinute(done ? null : value),
    );
  };

  const minuteUnderPointer = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - box.left) / box.width) * WIDTH;
    return from + ((svgX - PLOT.left) / (PLOT.right - PLOT.left)) * (to - from);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Au doigt, on capture le geste : le repère suit même si le doigt sort du cadre.
    if (event.pointerType !== "mouse") event.currentTarget.setPointerCapture(event.pointerId);
    moveTo(minuteUnderPointer(event));
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragging = event.currentTarget.hasPointerCapture(event.pointerId);
    if (event.pointerType === "mouse" || dragging) moveTo(minuteUnderPointer(event));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      release();
      return;
    }
    const step = KEY_STEPS[event.key];
    const next =
      step !== undefined
        ? Math.round(minute) + step
        : event.key === "Home"
          ? from
          : event.key === "End"
            ? to
            : undefined;
    if (next === undefined) return;
    event.preventDefault();
    moveTo(next);
  };

  const crossover = crossovers.find((candidate) => Math.abs(candidate - minute) < 0.75);
  const readout =
    crossover !== undefined
      ? copy.crossover(Math.round(crossover))
      : advantageLabel(advantageAt(curves, minute));
  const powers = curves.at(minute);
  const guideX = x(minute);
  // La poignée et la phase mise en avant suivent la même minute arrondie.
  const shownMinute = Math.round(minute);

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-2">
        <h3
          className="intro-fade text-sm font-semibold text-ink-muted"
          style={delay(introDelay - 150)}
        >
          {copy.title}
        </h3>
        <p
          aria-hidden
          className="intro-fade text-sm font-semibold text-accent tabular"
          style={delay(introDelay + 700)}
        >
          {readout}
        </p>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={copy.sliderLabel}
        aria-orientation="horizontal"
        aria-valuemin={from}
        aria-valuemax={to}
        aria-valuenow={shownMinute}
        aria-valuetext={`${copy.minute(shownMinute)}, ${readout}`}
        className="relative w-full cursor-ew-resize touch-pan-y select-none"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") release();
        }}
        onKeyDown={handleKeyDown}
        onBlur={release}
      >
        {/* Repères fixes : les frontières entre les phases de la partie */}
        <svg
          aria-hidden
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="absolute inset-0 size-full"
          fill="none"
        >
          {GAME_PHASES.slice(1).map((phase) => (
            <line
              key={phase.id}
              x1={x(phase.from)}
              x2={x(phase.from)}
              y1={PLOT.top - 6}
              y2={PLOT.bottom}
              strokeDasharray="1.5 4"
              strokeLinecap="round"
              className="stroke-line-strong/70"
            />
          ))}
          <line
            x1={PLOT.left}
            x2={PLOT.right}
            y1={PLOT.bottom}
            y2={PLOT.bottom}
            className="stroke-line"
          />
        </svg>

        {/* Les courbes, dévoilées de gauche à droite comme le temps qui passe */}
        <svg
          aria-hidden
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="absolute inset-0 size-full intro-wipe"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={delay(introDelay)}
        >
          {/* Notre fenêtre, hachurée dans l'angle de la barre du logo */}
          <defs>
            <pattern
              id={hatchId}
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(16)"
            >
              <line
                x1="0.75"
                x2="0.75"
                y1="0"
                y2="5"
                strokeWidth="1.5"
                className="stroke-accent/65"
              />
            </pattern>
          </defs>
          <path d={shapes.window} fill={`url(#${hatchId})`} />
          <path
            d={shapes.theirs}
            strokeWidth="1.8"
            strokeDasharray="1 5"
            className="stroke-ink-muted"
          />
          <path d={shapes.ours} strokeWidth="2.4" className="stroke-ink" />
        </svg>

        {/* Le repère de lecture */}
        <svg
          aria-hidden
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="absolute inset-0 size-full intro-fade overflow-visible"
          fill="none"
          style={delay(introDelay + 650)}
        >
          <line
            x1={guideX}
            x2={guideX}
            y1={PLOT.top - 8}
            y2={PLOT.bottom}
            strokeWidth="1.2"
            className="stroke-accent"
          />
          <circle
            cx={guideX}
            cy={y(powers.theirs)}
            r="3.7"
            strokeWidth="1.7"
            className="fill-field stroke-ink-muted"
          />
          <circle
            cx={guideX}
            cy={y(powers.ours)}
            r="4.1"
            strokeWidth="1.6"
            className="fill-ink stroke-field"
          />
        </svg>

        {/* Étiquettes posées au bout de chaque courbe */}
        <span
          className="pointer-events-none absolute flex -translate-y-full intro-fade items-center gap-1.5 pb-1.5 text-xs font-semibold text-ink"
          style={{
            ...delay(introDelay + 250),
            left: percent(x(from + 0.5), WIDTH),
            top: percent(labelTops.ours, HEIGHT),
          }}
        >
          <TeamMark side="ours" />
          {copy.ours}
        </span>
        <span
          className="pointer-events-none absolute flex -translate-y-full intro-fade items-center gap-1.5 pb-1.5 text-xs font-semibold text-ink-muted"
          style={{
            ...delay(introDelay + 850),
            right: percent(WIDTH - x(to - 0.5), WIDTH),
            top: percent(labelTops.theirs, HEIGHT),
          }}
        >
          <TeamMark side="theirs" />
          {copy.theirs}
        </span>

        {/* La poignée : indique la minute et invite à faire glisser */}
        <span
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 intro-fade rounded-pill bg-accent px-2 text-xs leading-5 font-bold whitespace-nowrap text-on-accent tabular shadow-key"
          style={{
            ...delay(introDelay + 650),
            left: `clamp(1.75rem, ${percent(guideX, WIDTH)}, calc(100% - 1.75rem))`,
            top: percent(PLOT.bottom, HEIGHT),
          }}
        >
          {copy.minute(shownMinute)}
        </span>
      </div>

      <div aria-hidden className="flex pt-1 text-xs">
        {GAME_PHASES.map((phase) => (
          <span
            key={phase.id}
            className={cn(
              "text-center transition-colors duration-(--duration-fast)",
              shownMinute >= phase.from && (shownMinute < phase.to || phase.to === to)
                ? "font-semibold text-ink"
                : "text-ink-faint",
            )}
            style={{ width: percent(phase.to - phase.from, to - from) }}
          >
            {copy.phases[phase.id]}
          </span>
        ))}
      </div>
    </div>
  );
}
