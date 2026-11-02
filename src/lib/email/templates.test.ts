import { describe, expect, it } from "vitest";

import { resetPasswordMessage, verifyEmailMessage } from "./templates";

describe("e-mails", () => {
  it("met le lien dans le texte et dans le bouton", () => {
    const link = "https://gufo.gg/verify-email?token=abc";
    const email = verifyEmailMessage("joueur@example.test", "Akii", link);
    expect(email.to).toBe("joueur@example.test");
    expect(email.text).toContain(link);
    expect(email.html).toContain(`href="${link}"`);
    expect(email.text).toContain("Salut Akii,");
  });

  it("échappe le pseudo dans la version HTML", () => {
    const email = resetPasswordMessage("x@example.test", "<script>", "https://gufo.gg/r?t=1");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
