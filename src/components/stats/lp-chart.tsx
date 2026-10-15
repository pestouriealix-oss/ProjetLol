"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";

const copy = t.stats.lp;

export type ChartPoint = {
  /** Date du relevé, déjà mise en forme (« 15 oct. »). */
  date: string;
  /** Rang lisible (« Argent IV »). */
  rank: string;
  lp: number;
  /** Position sur l'échelle (voir `ladderPoints`) : la hauteur du point. */
  points: number;
  /** Millisecondes : la position horizontale. */
  time: number;
};

export type ChartFloor = { label: string; points: number };

const WIDTH = 1000;
const HEIGHT = 280;
const PAD = { top: 16, right: 16, bottom: 16, left: 16 };

/**
 * Courbe du classement : une seule série, un trait de 2 px, les paliers en
 * repères horizontaux discrets. Le survol (ou les flèches du clavier) montre
 * le relevé le plus proche, avec une ligne verticale et une bulle ; le même
 * contenu existe en tableau pour qui ne voit pas le graphique.
 */
export function LpChart({ points, floors }: { points: ChartPoint[]; floors: ChartFloor[] }) {
  const [active, setActive] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const hintId = useId();

  const values = points.map((point) => point.points);
  // Une marge d'une demi-division au-dessus et en dessous, et au moins une division d'amplitude.
  let min = Math.min(...values) - 50;
  let max = Math.max(...values) + 50;
  if (max - min < 200) {
    const middle = (max + min) / 2;
    min = middle - 100;
    max = middle + 100;
  }
  const first = points[0]?.time ?? 0;
  const last = points.at(-1)?.time ?? 1;
  const x = (time: number) =>
    PAD.left + ((time - first) / Math.max(1, last - first)) * (WIDTH - PAD.left - PAD.right);
  const y = (value: number) =>
    PAD.top + (1 - (value - min) / (max - min)) * (HEIGHT - PAD.top - PAD.bottom);

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.time)},${y(point.points)}`)
    .join(" ");
  const visibleFloors = floors.filter((floor) => floor.points > min && floor.points < max);

  const pick = (event: PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    if (!frame) return;
    const box = frame.getBoundingClientRect();
    const svgX = ((event.clientX - box.left) / box.width) * WIDTH;
    let nearest = 0;
    for (const [index, point] of points.entries()) {
      if (Math.abs(x(point.time) - svgX) < Math.abs(x(points[nearest]!.time) - svgX)) {
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

  const shown = active !== null ? points[active] : undefined;
  const leftPercent = (value: number) => `${(value / WIDTH) * 100}%`;
  const topPercent = (value: number) => `${(value / HEIGHT) * 100}%`;

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={frameRef}
        role="img"
        tabIndex={0}
        aria-label={copy.label}
        aria-describedby={hintId}
        onPointerMove={pick}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={onKey}
        className="relative h-56 touch-pan-y rounded-panel border border-line bg-surface outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent sm:h-64"
      >
        <svg
          aria-hidden
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
        >
          {visibleFloors.map((floor) => (
            <line
              key={floor.label}
              x1={0}
              x2={WIDTH}
              y1={y(floor.points)}
              y2={y(floor.points)}
              className="stroke-line"
              strokeWidth={1}
              strokeDasharray="4 6"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {shown ? (
            <line
              x1={x(shown.time)}
              x2={x(shown.time)}
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
            className="stroke-ink"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Noms des paliers, en HTML pour rester nets quelle que soit la largeur. */}
        {visibleFloors.map((floor) => (
          <span
            key={floor.label}
            aria-hidden
            className="absolute left-3 -translate-y-full pb-0.5 text-[0.6875rem] font-semibold text-ink-faint"
            style={{ top: topPercent(y(floor.points)) }}
          >
            {floor.label}
          </span>
        ))}

        {/* Dernier relevé toujours marqué ; le relevé survolé, en plus gros. */}
        {[
          points.length - 1,
          ...(active !== null && active !== points.length - 1 ? [active] : []),
        ].map((index) => {
          const point = points[index];
          if (!point) return null;
          return (
            <span
              key={index}
              aria-hidden
              className={cn(
                "absolute size-2.5 -translate-1/2 rounded-full bg-ink ring-2 ring-surface",
                index === active && "size-3",
              )}
              style={{ left: leftPercent(x(point.time)), top: topPercent(y(point.points)) }}
            />
          );
        })}

        {shown ? (
          <div
            aria-live="polite"
            className={cn(
              "pointer-events-none absolute top-2 z-10 rounded-control border border-line-strong bg-raised px-3 py-2 text-sm shadow-lift",
              x(shown.time) > WIDTH / 2 ? "-translate-x-[calc(100%+12px)]" : "translate-x-3",
            )}
            style={{ left: leftPercent(x(shown.time)) }}
          >
            <p className="text-xs text-ink-faint">{shown.date}</p>
            <p className="font-semibold whitespace-nowrap text-ink">
              {shown.rank} · <span className="tabular">{shown.lp} LP</span>
            </p>
          </div>
        ) : null}
      </div>
      <p id={hintId} className="sr-only">
        {copy.keyboard}
      </p>
    </div>
  );
}
