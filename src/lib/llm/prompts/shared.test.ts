import { describe, expect, it } from "vitest";

import { clip, modelList, modelText } from "./shared";

describe("clip", () => {
  it("garde un texte assez court tel quel", () => {
    expect(clip("Court.", 20)).toBe("Court.");
  });

  it("coupe à la dernière phrase entière qui tient", () => {
    expect(clip("Première phrase utile. Seconde phrase bien trop longue pour tenir.", 40)).toBe(
      "Première phrase utile.",
    );
  });

  it("sinon coupe au dernier mot, avec des points de suspension", () => {
    expect(clip("Une seule phrase beaucoup trop longue pour la place", 30)).toBe(
      "Une seule phrase beaucoup…",
    );
  });
});

describe("modelText et modelList", () => {
  it("raccourcit au lieu de refuser, et refuse seulement le vide", () => {
    expect(modelText(10).parse("  Bonjour à toi, joueur  ")).toBe("Bonjour à…");
    expect(modelText(10).safeParse("   ").success).toBe(false);
  });

  it("ignore les éléments en trop, mais exige le minimum", () => {
    const list = modelList(modelText(10), 2, 3);
    expect(list.parse(["a", "b", "c", "d"])).toEqual(["a", "b", "c"]);
    expect(list.safeParse(["a"]).success).toBe(false);
  });
});
