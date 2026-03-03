import "server-only";

import Stripe from "stripe";
import { serverRuntimeConfig } from "@/lib/env";

let stripeClient: Stripe | undefined;

export function getStripeClient() {
  if (!serverRuntimeConfig.stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(serverRuntimeConfig.stripeSecretKey, {
      appInfo: {
        name: "Insight Artitico",
      },
    });
  }

  return stripeClient;
}
