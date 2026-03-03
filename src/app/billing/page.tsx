import Link from "next/link";
import { requireAuthContext, getSubscriptionForUser } from "@/lib/auth/session";
import { serverRuntimeConfig } from "@/lib/env";
import { UpgradeButton } from "./UpgradeButton";

export default async function BillingPage() {
  const auth = await requireAuthContext();
  const subscription = await getSubscriptionForUser(auth.user.id);
  const currentPlan = subscription?.plan ?? "free";

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-600">Billing</p>
          <h1 className="text-2xl font-semibold text-zinc-900">Planos e cobrança</h1>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Voltar ao dashboard
        </Link>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-900/5">
          <h2 className="text-lg font-semibold text-zinc-900">Plano Free</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Métricas públicas com atualização diária e alertas no dashboard.
          </p>
          <p className="mt-5 text-xl font-semibold text-zinc-900">R$ 0</p>
        </article>
        <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 shadow-lg shadow-indigo-900/5">
          <h2 className="text-lg font-semibold text-zinc-900">Plano PRO</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Cobrança ativa + entitlement PRO. OAuth Spotify for Artists entra na fase 2.
          </p>
          <p className="mt-5 text-xl font-semibold text-zinc-900">Assinatura mensal</p>
          <div className="mt-6">
            <UpgradeButton
              currentPlan={currentPlan}
              priceId={serverRuntimeConfig.stripeProPriceId ?? null}
            />
          </div>
        </article>
      </section>
    </main>
  );
}
