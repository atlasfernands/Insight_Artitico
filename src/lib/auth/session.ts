import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type { SubscriptionPlan } from "@/lib/types";

export interface AuthContext {
  user: {
    id: string;
    email: string;
  };
}

export async function getOptionalAuthContext(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
  };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getOptionalAuthContext();
  if (!ctx) {
    redirect("/login");
  }
  return ctx;
}

export async function getLinkedArtistIdForUser(
  userId: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("user_artist_links")
    .select("artist_id")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.artist_id ?? null;
}

export async function getSubscriptionForUser(userId: string): Promise<{
  plan: SubscriptionPlan;
  status: string;
} | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    plan: data.plan,
    status: data.status,
  };
}

export function hasProEntitlement(
  subscription: { plan: SubscriptionPlan; status: string } | null,
) {
  if (!subscription) {
    return false;
  }

  const paidStatuses = new Set(["active", "trialing", "past_due"]);
  return subscription.plan === "pro" && paidStatuses.has(subscription.status);
}

export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
