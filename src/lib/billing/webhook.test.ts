import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { readPaddleEvent, verifyPaddleSignature } from "./webhook";

const secret = "pdl_ntfset_test";
const now = new Date("2026-10-22T18:00:00Z");
const ts = Math.floor(now.getTime() / 1000);
const sign = (body: string, at = ts, key = secret) =>
  `ts=${at};h1=${createHmac("sha256", key).update(`${at}:${body}`).digest("hex")}`;

describe("verifyPaddleSignature", () => {
  const body = JSON.stringify({ event_type: "subscription.created" });

  it("accepte une signature valide, même parmi plusieurs pendant une rotation", () => {
    expect(verifyPaddleSignature(body, sign(body), secret, now)).toBe(true);
    const rotated = `${sign(body)};h1=${"0".repeat(64)}`;
    expect(verifyPaddleSignature(body, rotated, secret, now)).toBe(true);
  });

  it("refuse un corps modifié, un autre secret, un en-tête absent ou malformé", () => {
    expect(verifyPaddleSignature(`${body} `, sign(body), secret, now)).toBe(false);
    expect(verifyPaddleSignature(body, sign(body, ts, "autre"), secret, now)).toBe(false);
    expect(verifyPaddleSignature(body, null, secret, now)).toBe(false);
    expect(verifyPaddleSignature(body, "h1=abc", secret, now)).toBe(false);
  });

  it("refuse une notification trop ancienne (rejouée)", () => {
    expect(verifyPaddleSignature(body, sign(body, ts - 3600), secret, now)).toBe(false);
  });
});

describe("readPaddleEvent", () => {
  it("lit un abonnement, sa période et sa résiliation programmée", () => {
    const event = readPaddleEvent({
      event_type: "subscription.updated",
      occurred_at: "2026-10-22T18:00:00Z",
      data: {
        id: "sub_01",
        status: "active",
        customer_id: "ctm_01",
        custom_data: { userId: "user-1" },
        items: [{ price: { id: "pri_01" } }],
        current_billing_period: { ends_at: "2026-11-22T18:00:00Z" },
        scheduled_change: { action: "cancel", effective_at: "2026-11-22T18:00:00Z" },
      },
    });
    expect(event).toEqual({
      kind: "subscription",
      occurredAt: new Date("2026-10-22T18:00:00Z"),
      subscription: {
        id: "sub_01",
        status: "active",
        customerId: "ctm_01",
        userId: "user-1",
        priceId: "pri_01",
        currentPeriodEnd: new Date("2026-11-22T18:00:00Z"),
        cancelAt: new Date("2026-11-22T18:00:00Z"),
      },
    });
  });

  it("retient le client d'un paiement, et ignore le reste", () => {
    expect(
      readPaddleEvent({
        event_type: "transaction.completed",
        occurred_at: "2026-10-22T18:00:00Z",
        data: { customer_id: "ctm_01", custom_data: { userId: "user-1" } },
      }),
    ).toEqual({ kind: "customer", customerId: "ctm_01", userId: "user-1" });
    expect(
      readPaddleEvent({
        event_type: "customer.updated",
        occurred_at: "2026-10-22T18:00:00Z",
        data: {},
      }),
    ).toEqual({ kind: "ignored", eventType: "customer.updated" });
  });
});
