"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";

const copy = t.progression.trends;

export type TrendChartPoint = {
  /** « 3 nov. » */
  date: string;
  champion: string;
  win: boolean;
  value: number;
  /** La valeur mise en forme (« 6,8 », « 55 % »). */
  label: string;
};

const WIDTH = 600;
const HEIGHT = 160;
const PAD = { top: 14, right: 12, bottom: 14, left: 12 };

/**
 * Courbe d'un indicateur, partie après partie : un trait, un point par partie,
 * la moyenne en pointillé discret et, s'il porte sur cet indicateur, la cible
 * du coach en pointillé corail. Le survol (ou les flèches du clavier) montre la
 * partie la plus proche ; la même liste existe en texte pour qui ne voit pas
 * le graphique.
 */
export function TrendChart({
  points,
  average,
  target,
  label,
}: {
  points: TrendChartPoint[];
  average: number;
  /** La cible du coach, déjà mise en forme pour l'étiquette. */
  target: { value: number; label: string } | null;
  label: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const hintId = useId();

  const values = [
    ...points.map((point) => point.value),
    average,
    ...(target ? [target.value] : []),
  ];
  let min = Math.min(...values);
  let max = Math.max(...values);
  // Une courbe plate reste lisible : on lui donne de l'air plutôt qu'une amplitude nulle.
  const span = Math.max(max - min, Math.abs(max) * 0.2, 1);
  min -= span * 0.15;
  max += span * 0.15;

  const x = (index: number) =>
    PAD.left + (index / Math.max(1, points.length - 1)) * (WIDTH - PAD.left - PAD.right);
  const y = (value: number) =>
    PAD.top + (1 - (value - min) / (max - min)) * (HEIGHT - PAD.top - PAD.bottom);

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.value)}`)
    .join(" ");

  const pick = (event: PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    if (!frame) return;
    const box = frame.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    const svgX = ratio * WIDTH;
    const step = (WIDTH - PAD.left - PAD.right) / Math.max(1, points.length - 1);
    setActive(Math.min(points.length - 1, Math.max(0, Math.round((svgX - PAD.left) / step))));
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    setActive((current) =>
      Math.min(points.length - 1, Math.max(0, (current ?? points.length - 1) + step)),
    );
  };

  const shown = active !== null ? points[active] : undefined;
  const left = (value: number) => `${(value / WIDTH) * 100}%`;
  const top = (value: number) => `${(value / HEIGHT) * 100}%`;

  return (
    <div className="flex flex-col gap-1">
      <div
        ref={frameRef}
        role="img"
        tabIndex={0}
        aria-label={label}
        aria-describedby={hintId}
        onPointerMove={pick}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={onKey}
        className="relative h-36 touch-pan-y rounded-control outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <svg
          aria-hidden
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
        >
          <line
            x1={0}
            x2={WIDTH}
            y1={y(average)}
            y2={y(average)}
            className="stroke-line-strong"
            strokeWidth={1}
            strokeDasharray="2 5"
            vectorEffect="non-scaling-stroke"
          />
          {target ? (
            <line
              x1={0}
              x2={WIDTH}
              y1={y(target.value)}
              y2={y(target.value)}
              className="stroke-accent"
              strokeWidth={1.5}
              strokeDasharray="6 5"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {shown && active !== null ? (
            <line
              x1={x(active)}
              x2={x(active)}
              y1={0}
              y2={HEIGHT}
              className="stroke-line-strong"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          <path
            d={path}
            fill="none"
            className="stroke-ink-muted"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {target ? (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute right-1 rounded-[3px] bg-surface/90 px-1 text-[0.6875rem] font-semibold text-accent tabular",
              // L'étiquette se place du côté où il reste de la place.
              y(target.value) < HEIGHT / 2 ? "translate-y-0.5" : "-translate-y-full",
            )}
            style={{ top: top(y(target.value)) }}
          >
            {copy.targetLine(target.label)}
          </span>
        ) : null}

        {/* Points en HTML : ils restent ronds quelle que soit la largeur. */}
        {points.map((point, index) => (
          <span
            key={index}
            aria-hidden
            className={cn(
              "pointer-events-none absolute -translate-1/2 rounded-full ring-2 ring-surface",
              index === points.length - 1 || index === active
                ? "size-2.5 bg-ink"
                : "size-1.5 bg-ink-muted",
              index === active && "size-3",
            )}
            style={{ left: left(x(index)), top: top(y(point.value)) }}
          />
        ))}

        {shown && active !== null ? (
          <div
            aria-live="polite"
            className={cn(
              "pointer-events-none absolute top-0 z-10 rounded-control border border-line-strong bg-raised px-2.5 py-1.5 text-sm shadow-lift",
              x(active) > WIDTH / 2 ? "-translate-x-[calc(100%+10px)]" : "translate-x-2.5",
            )}
            style={{ left: left(x(active)) }}
          >
            <p className="text-xs whitespace-nowrap text-ink-faint">
              {shown.date} · {shown.champion}
            </p>
            <p className="font-semibold whitespace-nowrap text-ink tabular">
              {shown.label}{" "}
              <span className={cn("text-xs", shown.win ? "text-win" : "text-loss")}>
                {shown.win ? t.matches.win : t.matches.loss}
              </span>
            </p>
          </div>
        ) : null}
      </div>
      <ul className="sr-only">
        {points.map((point, index) => (
          <li key={index}>{copy.point(point.date, point.champion, point.win, point.label)}</li>
        ))}
      </ul>
      <p id={hintId} className="sr-only">
        {copy.keyboard}
      </p>
    </div>
  );
}
