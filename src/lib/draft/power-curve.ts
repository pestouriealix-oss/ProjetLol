/**
 * Courbe de puissance : la force relative des deux équipes au fil de la partie.
 *
 * Le modèle ne donnera que quelques points de repère (début, milieu, fin de
 * partie). Ce module en tire une courbe lisse, trouve le moment où l'avantage
 * bascule, et dit qui mène à une minute donnée. Fonctions pures, sans
 * dépendance à l'affichage.
 */

export type PowerPoint = {
  /** Minute de jeu. */
  minute: number;
  /** Force de notre équipe, de 0 à 100. */
  ours: number;
  /** Force de l'équipe adverse, de 0 à 100. */
  theirs: number;
};

/** Points de repère triés par minute croissante (au moins deux). */
export type PowerSeries = readonly PowerPoint[];

export type Advantage = {
  leader: "ours" | "theirs" | "even";
  /** `null` quand les équipes sont à égalité. */
  strength: "slight" | "clear" | null;
  /** Notre force moins la leur. */
  diff: number;
};

/** En dessous de cet écart, on parle d'équilibre. */
const EVEN_THRESHOLD = 4;
/** Au-dessus de cet écart, l'avantage est net. */
const CLEAR_THRESHOLD = 15;

type Point = { x: number; y: number };

/**
 * Interpolation cubique monotone (Fritsch-Carlson). Contrairement à une spline
 * classique, elle ne dépasse jamais les valeurs données : une équipe notée 80
 * au maximum n'affichera pas 84 entre deux repères.
 */
export function createInterpolator(points: readonly Point[]): (x: number) => number {
  if (points.length < 2) throw new Error("Il faut au moins deux points pour interpoler.");
  for (let i = 1; i < points.length; i++) {
    if (points[i]!.x <= points[i - 1]!.x) {
      throw new Error("Les points doivent être triés par abscisse strictement croissante.");
    }
  }

  const count = points.length;
  const widths: number[] = [];
  const slopes: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    const width = points[i + 1]!.x - points[i]!.x;
    widths.push(width);
    slopes.push((points[i + 1]!.y - points[i]!.y) / width);
  }

  // Pente de la courbe à chaque point de repère.
  const tangents: number[] = [slopes[0]!];
  for (let i = 1; i < count - 1; i++) {
    const before = slopes[i - 1]!;
    const after = slopes[i]!;
    if (before * after <= 0) {
      // Sommet ou creux : tangente plate, pour ne pas dépasser.
      tangents.push(0);
    } else {
      const weightBefore = 2 * widths[i]! + widths[i - 1]!;
      const weightAfter = widths[i]! + 2 * widths[i - 1]!;
      tangents.push((weightBefore + weightAfter) / (weightBefore / before + weightAfter / after));
    }
  }
  tangents.push(slopes[count - 2]!);

  const first = points[0]!;
  const last = points[count - 1]!;

  return (x: number) => {
    if (x <= first.x) return first.y;
    if (x >= last.x) return last.y;

    let index = 0;
    while (index < count - 2 && x > points[index + 1]!.x) index++;

    const start = points[index]!;
    const end = points[index + 1]!;
    const width = widths[index]!;
    const t = (x - start.x) / width;
    const t2 = t * t;
    const t3 = t2 * t;

    return (
      (2 * t3 - 3 * t2 + 1) * start.y +
      (t3 - 2 * t2 + t) * width * tangents[index]! +
      (-2 * t3 + 3 * t2) * end.y +
      (t3 - t2) * width * tangents[index + 1]!
    );
  };
}

export type PowerCurves = {
  from: number;
  to: number;
  /** Force des deux équipes à une minute donnée (bornée au domaine). */
  at: (minute: number) => { ours: number; theirs: number };
};

export function createPowerCurves(series: PowerSeries): PowerCurves {
  const ours = createInterpolator(series.map((point) => ({ x: point.minute, y: point.ours })));
  const theirs = createInterpolator(series.map((point) => ({ x: point.minute, y: point.theirs })));
  return {
    from: series[0]!.minute,
    to: series[series.length - 1]!.minute,
    at: (minute) => ({ ours: ours(minute), theirs: theirs(minute) }),
  };
}

/** Échantillonne les courbes à pas régulier, bornes comprises. */
export function samplePowerCurves(curves: PowerCurves, step = 0.5): PowerPoint[] {
  const samples: PowerPoint[] = [];
  const count = Math.round((curves.to - curves.from) / step);
  for (let i = 0; i <= count; i++) {
    const minute = i === count ? curves.to : curves.from + i * step;
    samples.push({ minute, ...curves.at(minute) });
  }
  return samples;
}

/**
 * Minutes où l'avantage change de camp. Un simple contact entre les deux
 * courbes, sans croisement, n'est pas une bascule.
 */
export function findCrossovers(curves: PowerCurves, step = 0.25): number[] {
  const samples = samplePowerCurves(curves, step);
  const crossovers: number[] = [];
  let previousSign = 0;
  let previous = samples[0]!;

  for (const sample of samples) {
    const diff = sample.ours - sample.theirs;
    const sign = Math.sign(diff);
    if (sign !== 0) {
      if (previousSign !== 0 && sign !== previousSign) {
        // Racine par interpolation linéaire entre les deux derniers échantillons de signe opposé.
        const previousDiff = previous.ours - previous.theirs;
        const ratio = previousDiff / (previousDiff - diff);
        crossovers.push(previous.minute + ratio * (sample.minute - previous.minute));
      }
      previousSign = sign;
      previous = sample;
    }
  }
  return crossovers;
}

export function advantageAt(curves: PowerCurves, minute: number): Advantage {
  const { ours, theirs } = curves.at(minute);
  const diff = ours - theirs;
  const gap = Math.abs(diff);

  if (gap < EVEN_THRESHOLD) return { leader: "even", strength: null, diff };
  return {
    leader: diff > 0 ? "ours" : "theirs",
    strength: gap >= CLEAR_THRESHOLD ? "clear" : "slight",
    diff,
  };
}
