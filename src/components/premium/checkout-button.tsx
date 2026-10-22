"use client";

import { initializePaddle } from "@paddle/paddle-js";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/notice";
import { t } from "@/i18n/fr";

const copy = t.premium;

/**
 * Ouvre le paiement de Paddle par-dessus la page. L'identifiant de
 * l'utilisateur voyage avec le paiement : la notification de Paddle dit ainsi
 * à qui donner Premium.
 */
export function CheckoutButton({
  config,
  email,
  userId,
}: {
  config: { environment: "sandbox" | "production"; clientToken: string; priceId: string };
  email: string;
  userId: string;
}) {
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(0);

  const open = async () => {
    setOpening(true);
    try {
      const paddle = await initializePaddle({
        environment: config.environment,
        token: config.clientToken,
      });
      if (!paddle) throw new Error("Paddle.js ne s'est pas chargé.");
      paddle.Checkout.open({
        items: [{ priceId: config.priceId, quantity: 1 }],
        customer: { email },
        customData: { userId },
        settings: {
          displayMode: "overlay",
          locale: "fr",
          theme: "dark",
          successUrl: `${window.location.origin}/premium?merci=1`,
        },
      });
    } catch (error) {
      console.error(error);
      setFailed((count) => count + 1);
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <Button size="lg" variant="secondary" pending={opening} onClick={() => void open()}>
        {opening ? copy.opening : copy.subscribe}
      </Button>
      {failed > 0 ? <ErrorNotice attempt={failed}>{copy.loadError}</ErrorNotice> : null}
    </div>
  );
}
