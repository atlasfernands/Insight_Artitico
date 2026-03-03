import { NextResponse } from "next/server";
import Stripe from "stripe";
import { serverRuntimeConfig } from "@/lib/env";
import { getStripeClient } from "@/lib/billing/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

function resolvePlanFromSubscription(
  subscription: Stripe.Subscription,
  proPriceId: string | undefined,
): "free" | "pro" {
  const hasProPrice = subscription.items.data.some(
    (item) => item.price.id === proPriceId,
  );
  const paidStatuses = new Set(["active", "trialing", "past_due"]);
  if (hasProPrice && paidStatuses.has(subscription.status)) {
    return "pro";
  }
  return "free";
}

async function upsertFromSubscription(subscription: Stripe.Subscription) {
  const admin = createSupabaseAdminClient();
  const plan = resolvePlanFromSubscription(
    subscription,
    serverRuntimeConfig.stripeProPriceId,
  );
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end
    ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
    : null;

  const { data: subscriptionRow } = await admin
    .from("subscriptions")
    .select("user_id")
    .or(
      `stripe_subscription_id.eq.${subscription.id},stripe_customer_id.eq.${subscription.customer as string}`,
    )
    .maybeSingle();

  if (!subscriptionRow?.user_id) {
    logger.warn({
      event: "stripe_subscription_without_user",
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
    });
    return;
  }

  await admin.from("subscriptions").upsert(
    {
      user_id: subscriptionRow.user_id,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      plan,
      status: subscription.status,
      current_period_end: currentPeriodEnd,
    },
    { onConflict: "user_id" },
  );
}

export async function POST(request: Request) {
  const webhookSecret = serverRuntimeConfig.stripeWebhookSecret;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET ausente" },
      {
        status: 500,
      },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook inválido",
      },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId =
        session.client_reference_id ?? session.metadata?.user_id ?? null;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      if (userId && customerId) {
        let status = "checkout_completed";
        let currentPeriodEnd: string | null = null;
        let plan: "free" | "pro" = "free";

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          status = subscription.status;
          currentPeriodEnd = subscription.items.data[0]?.current_period_end
            ? new Date(
                subscription.items.data[0].current_period_end * 1000,
              ).toISOString()
            : null;
          plan = resolvePlanFromSubscription(
            subscription,
            serverRuntimeConfig.stripeProPriceId,
          );
        }

        await admin.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan,
            status,
            current_period_end: currentPeriodEnd,
          },
          { onConflict: "user_id" },
        );
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await upsertFromSubscription(event.data.object as Stripe.Subscription);
    }
  } catch (error) {
    logger.error({
      event: "stripe_webhook_processing_failed",
      type: event.type,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      { error: "Falha no processamento do webhook" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
