"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { createPortalUrl } from "@/lib/billing/paddle";
import { findBillingCustomer } from "@/lib/db/billing";

/** Ouvre le portail client de Paddle (factures, moyen de paiement, résiliation). */
export async function openBillingPortal(): Promise<void> {
  const user = await requireUser();
  const customerId = await findBillingCustomer(user.id);
  if (!customerId) redirect("/premium");

  let url: string;
  try {
    url = await createPortalUrl(customerId);
  } catch (error) {
    console.error("Portail Paddle indisponible", error);
    redirect("/premium?portail=erreur");
  }
  redirect(url);
}
