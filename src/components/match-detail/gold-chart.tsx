"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import { TeamMark } from "@/components/draft/team-mark";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { formatDuration, formatInteger } from "@/lib/format";
import { spread } from "@/lib/stats/spread";
import { minuteTicks } from "@/lib/stats/ticks";

const copy = t.matchDetail.timeline;

export type GoldPoint = { minute: number; diff: number };
export type ObjectiveMark = {
  seconds: number;
  ours: boolean;
  /** Lettre affichée sur la frise (« D », « B »…). */
  short: string;
  /** Description complète, pour le survol et les lecteurs d'écran. */
  label: string;
};

/** Une lettre de la frise et ce qu'elle désigne (« D » : Drake). */
export type ObjectiveLegend = { short: string; name: string };

const WIDTH = 1000;
const HEIGHT = 240;
const PAD_X = 12;

/** Place d'un repère de la frise, en pixels : la lettre et un peu d'air autour. */
const MARK_GAP = 13;
/** Largeur supposée avant la mesure : celle d'un téléphone, où les repères se touchent le plus. */
const ASSUMED_WIDTH = 340;

/**
 * Écart d'or entre les deux équipes : au-dessus de zéro, ton équipe mène ;
 * en dessous, l'adversaire. L'aire porte la couleur (victoire / défaite), le
 * trait et la bulle portent le chiffre, et le sens est écrit en toutes
 * lettres. Sous le graphique, la frise des objectifs, chacun marqué de la
 * forme de son équipe (rond pour toi, losange pour eux), l'axe des minutes,
 * puis la légende des lettres présentes.
 */
export function GoldChart({
  points,
  objectives,
  legend,
  durationSeconds,
}: {
  points: GoldPoint[];
  objectives: ObjectiveMark[];
  /** Les lettres de la frise présentes dans cette partie. */
  legend: ObjectiveLegend[];
  durationSeconds: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [measured, setMeasured] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const clipAbove = useId();
  const clipBelow = useId();

  const extent = Math.max(1000, ...points.map((point) => Math.abs(point.diff))) * 1.15;
  const lastMinute = Math.max(1, durationSeconds / 60, points.at(-1)?.minute ?? 1);
  const x = (minute: number) => PAD_X + (minute / lastMinute) * (WIDTH - 2 * PAD_X);
  const y = (diff: number) => HEIGHT / 2 - (diff / extent) * (HEIGHT / 2);
  const zero = y(0);
  const ticks = minuteTicks(lastMinute);

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.minute)},${y(point.diff)}`)
    .join(" ");
  const area =
    points.length > 0
      ? `${line} L${x(points.at(-1)!.minute)},${zero} L${x(points[0]!.minute)},${zero} Z`
      : "";

  const pick = (event: PointerEvent<HTMLDivElement>) => {
    const box = frameRef.current?.getBoundingClientRect();
    if (!box || points.length === 0) return;
    const minute =
      (((event.clientX - box.left) / box.width) * WIDTH - PAD_X) /
      ((WIDTH - 2 * PAD_X) / lastMinute);
    let nearest = 0;
    for (const [index, point] of points.entries()) {
      if (Math.abs(point.minute - minute) < Math.abs(points[nearest]!.minute - minute)) {
        nearest = index;
      }
    }
    setActive(nearest);
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    setActive((current) =>
      Math.min(points.length - 1, Math.max(0, (current ?? points.length - 1) + step)),
    );
  };

  // La largeur réelle du graphique : deux objectifs pris à quelques secondes
  // d'intervalle se chevauchent ou non selon elle. Mesurée avant l'affichage.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setMeasured(entry.contentRect.width);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const shown = active !== null ? points[active] : undefined;
  const left = (value: number) => `${(value / WIDTH) * 100}%`;

  // Chaque équipe a sa ligne sur la frise : on écarte les repères ligne par ligne.
  const railWidth = measured ?? ASSUMED_WIDTH;
  const marks = [true, false].flatMap((ours) => {
    const row = objectives
      .filter((objective) => objective.ours === ours)
      .sort((a, b) => a.seconds - b.seconds);
    const placed = spread(
      row.map((objective) => (x(objective.seconds / 60) / WIDTH) * railWidth),
      MARK_GAP,
      MARK_GAP / 2,
      railWidth - MARK_GAP / 2,
    );
    return row.map((objective, index) => ({
      ...objective,
      left: `${((placed[index] ?? 0) / railWidth) * 100}%`,
    }));
  });
  const describe = (diff: number) => {
    const amount = formatInteger(Math.abs(Math.round(diff)));
    return diff > 0
      ? copy.gold.ahead(amount)
      : diff < 0
        ? copy.gold.behind(amount)
        : copy.gold.even;
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={frameRef}
        role="img"
        tabIndex={0}
        aria-label={copy.gold.label}
        aria-describedby={hintId}
        onPointerMove={pick}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={onKey}
        className="relative h-48 touch-pan-y rounded-panel border border-line bg-surface outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent sm:h-56"
      >
        <svg
          aria-hidden
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
        >
          <defs>
            <clipPath id={clipAbove}>
              <rect x={0} y={0} width={WIDTH} height={zero} />
            </clipPath>
            <clipPath id={clipBelow}>
              <rect x={0} y={zero} width={WIDTH} height={HEIGHT - zero} />
            </clipPath>
          </defs>
          {ticks.map((minute) => (
            <line
              key={minute}
              x1={x(minute)}
              x2={x(minute)}
              y1={0}
              y2={HEIGHT}
              className="stroke-line"
              strokeWidth={1}
              strokeDasharray="2 6"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={area} clipPath={`url(#${clipAbove})`} className="fill-win/25" />
          <path d={area} clipPath={`url(#${clipBelow})`} className="fill-loss/25" />
          <line
            x1={0}
            x2={WIDTH}
            y1={zero}
            y2={zero}
            className="stroke-line-strong"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {shown ? (
            <line
              x1={x(shown.minute)}
              x2={x(shown.minute)}
              y1={0}
              y2={HEIGHT}
              className="stroke-line-strong"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          <path
            d={line}
            fill="none"
            className="stroke-ink"
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <span aria-hidden className="absolute top-2 left-3 text-[0.6875rem] font-semibold text-win">
          {copy.ours}
        </span>
        <span
          aria-hidden
          className="absolute bottom-2 left-3 text-[0.6875rem] font-semibold text-loss"
        >
          {copy.theirs}
        </span>

        {shown ? (
          <>
            <span
              aria-hidden
              className="absolute size-3 -translate-1/2 rounded-full bg-ink ring-2 ring-surface"
              style={{ left: left(x(shown.minute)), top: `${(y(shown.diff) / HEIGHT) * 100}%` }}
            />
            <div
              aria-live="polite"
              className={cn(
                "pointer-events-none absolute top-2 z-10 rounded-control border border-line-strong bg-raised px-3 py-2 text-sm shadow-lift",
                x(shown.minute) > WIDTH / 2 ? "-translate-x-[calc(100%+12px)]" : "translate-x-3",
              )}
              style={{ left: left(x(shown.minute)) }}
            >
              <p className="text-xs text-ink-faint">{copy.gold.minute(shown.minute)}</p>
              <p className="font-semibold whitespace-nowrap text-ink tabular">
                {describe(shown.diff)}
              </p>
            </div>
          </>
        ) : null}
      </div>
      <p id={hintId} className="sr-only">
        {copy.gold.keyboard}
      </p>

      {/* Frise des objectifs, alignée sur le temps du graphique. */}
      {objectives.length > 0 ? (
        <div className="relative h-14" aria-label={copy.gold.table} role="list">
          {marks.map((mark, index) => (
            <span
              key={`${mark.seconds}-${index}`}
              role="listitem"
              title={mark.label}
              aria-label={mark.label}
              className={cn(
                "absolute flex -translate-x-1/2 flex-col items-center gap-0.5 text-[0.625rem] font-bold",
                mark.ours ? "top-0 text-ink" : "top-7 text-ink-muted",
              )}
              style={{ left: mark.left }}
            >
              <TeamMark side={mark.ours ? "ours" : "theirs"} className="size-2" />
              <span aria-hidden>{mark.short}</span>
            </span>
          ))}
        </div>
      ) : null}
      <p className="relative h-4 text-xs text-ink-faint tabular" aria-hidden>
        <span className="absolute left-0">0:00</span>
        {ticks.map((minute, index) => (
          <span
            key={minute}
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: left(x(minute)) }}
          >
            {index === 0 ? copy.gold.minute(minute) : minute}
          </span>
        ))}
        <span className="absolute right-0">{formatDuration(durationSeconds)}</span>
      </p>

      {legend.length > 0 ? (
        <ul
          aria-label={copy.legend}
          className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted"
        >
          <li className="flex items-center gap-1.5">
            <TeamMark side="ours" className="size-2" />
            {copy.oursLabel}
          </li>
          <li className="flex items-center gap-1.5">
            <TeamMark side="theirs" className="size-2" />
            {copy.theirsLabel}
          </li>
          {legend.map((entry) => (
            <li key={entry.short} className="flex items-center gap-1.5">
              <span className="font-bold text-ink">{entry.short}</span>
              {entry.name}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
