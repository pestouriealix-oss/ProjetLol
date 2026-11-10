import { describe, expect, it } from "vitest";

import { safeNext } from "./safe-next";

describe("retour après connexion", () => {
  it("garde une page du site", () => {
    expect(safeNext("/app?code=K7QM2XPA")).toBe("/app?code=K7QM2XPA");
  });

  it("refuse tout ce qui mènerait ailleurs", () => {
    for (const value of ["https://evil.test", "//evil.test", "/\\evil.test", "app", "", null]) {
      expect(safeNext(value)).toBeNull();
    }
  });
});
