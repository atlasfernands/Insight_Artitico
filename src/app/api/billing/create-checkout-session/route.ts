import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/billing/stripe";
import { serverRuntimeConfig } from "@/lib/env";

const BodySchema = z.object({
  priceId: z.string().min(3),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return NextResponse.json(
      { error: "Não autenticado" },
      {
        status: 401,
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const priceId = parsed.data.priceId;
  const expectedPriceId = serverRuntimeConfig.stripeProPriceId;
  if (!expectedPriceId) {
    return NextResponse.json(
      { error: "STRIPE_PRO_PRICE_ID não configurado" },
      { status: 500 },
    );
  }
  if (priceId !== expectedPriceId) {
    return NextResponse.json({ error: "priceId inválido" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const stripe = getStripeClient();

  const { data: existingSubscription } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = existingSubscription?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${serverRuntimeConfig.appUrl}/billing?success=1`,
    cancel_url: `${serverRuntimeConfig.appUrl}/billing?canceled=1`,
    metadata: {
      user_id: user.id,
    },
  });

  await admin.from("subscriptions").upsert(
    {
      user_id: user.id,
      stripe_customer_id: customerId,
      plan: "free",
      status: "checkout_pending",
    },
    {
      onConflict: "user_id",
    },
  );

  if (!checkout.url) {
    return NextResponse.json(
      { error: "Checkout URL indisponível" },
      { status: 500 },
    );
  }

  return NextResponse.json({ checkoutUrl: checkout.url });
}
