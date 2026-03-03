"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

interface UpgradeButtonProps {
  priceId: string | null;
  currentPlan: "free" | "pro";
}

export function UpgradeButton({ priceId, currentPlan }: UpgradeButtonProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkoutMessage = useMemo(() => {
    if (searchParams.get("success") === "1") {
      return "Upgrade concluído. Atualizando assinatura.";
    }
    if (searchParams.get("canceled") === "1") {
      return "Checkout cancelado.";
    }
    return "";
  }, [searchParams]);

  async function handleUpgrade() {
    if (!priceId) {
      setError("STRIPE_PRO_PRICE_ID não configurado.");
      return;
    }

    setLoading(true);
    setError("");

    const response = await fetch("/api/billing/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(payload?.error ?? "Falha ao criar checkout.");
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as { checkoutUrl: string };
    window.location.href = payload.checkoutUrl;
  }

  if (currentPlan === "pro") {
    return <p className="text-sm font-medium text-emerald-700">Plano PRO ativo.</p>;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={loading}
        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-70"
      >
        {loading ? "Redirecionando..." : "Fazer upgrade para PRO"}
      </button>
      {checkoutMessage ? <p className="text-sm text-emerald-700">{checkoutMessage}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
