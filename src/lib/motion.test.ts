import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { tween } from "./motion";

/** Fausse boucle d'animation : les images sont déclenchées à la main, à l'heure voulue. */
function fakeFrames() {
  let nextId = 0;
  const pending = new Map<number, FrameRequestCallback>();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    pending.set(++nextId, callback);
    return nextId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    pending.delete(id);
  });
  return {
    /** Joue l'image en attente avec cette heure. Renvoie faux s'il n'y en a pas. */
    frame(time: number): boolean {
      const [entry] = pending;
      if (!entry) return false;
      pending.delete(entry[0]);
      entry[1](time);
      return true;
    },
  };
}

describe("tween", () => {
  let frames: ReturnType<typeof fakeFrames>;

  beforeEach(() => {
    frames = fakeFrames();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("va de la valeur de départ à l'arrivée exacte, sans jamais sortir de l'intervalle", () => {
    const seen: Array<{ value: number; done: boolean }> = [];
    tween(37, 25, (value, done) => seen.push({ value, done }), 500);

    for (let time = 1000; frames.frame(time); time += 16) {
      // boucle jusqu'à la dernière image
    }

    expect(seen.at(0)).toEqual({ value: 37, done: false });
    expect(seen.at(-1)).toEqual({ value: 25, done: true });
    expect(seen.filter((step) => step.done)).toHaveLength(1);
    for (const { value } of seen) {
      expect(value).toBeLessThanOrEqual(37);
      expect(value).toBeGreaterThanOrEqual(25);
    }
    // La valeur ne revient jamais en arrière.
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i]!.value).toBeLessThanOrEqual(seen[i - 1]!.value);
    }
  });

  it("reste dans l'intervalle quand l'horloge des images est en retard sur l'horloge système", () => {
    // Cas réel : les outils de développement ralentissent les animations, et
    // l'heure passée aux images prend des secondes de retard.
    vi.spyOn(performance, "now").mockReturnValue(60_000);
    const seen: number[] = [];
    tween(10, 20, (value) => seen.push(value), 500);

    frames.frame(46_000);
    frames.frame(46_100);
    frames.frame(45_900); // une heure qui recule ne doit pas faire sortir la valeur non plus

    for (const value of seen) {
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    }
    vi.restoreAllMocks();
  });

  it("s'arrête quand on l'annule", () => {
    const seen: number[] = [];
    const cancel = tween(0, 100, (value) => seen.push(value), 500);
    frames.frame(0);
    frames.frame(100);
    cancel();

    expect(frames.frame(200)).toBe(false);
    expect(seen).toHaveLength(2);
  });

  it("saute directement à l'arrivée quand il n'y a rien à parcourir", () => {
    const onUpdate = vi.fn();
    tween(5, 5, onUpdate);
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(5, true);
    expect(frames.frame(0)).toBe(false);
  });
});
