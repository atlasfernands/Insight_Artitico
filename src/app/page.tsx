import Link from "next/link";
import { redirect } from "next/navigation";
import { getLinkedArtistIdForUser, getOptionalAuthContext } from "@/lib/auth/session";

export default async function Home() {
  const auth = await getOptionalAuthContext();
  if (auth) {
    const artistId = await getLinkedArtistIdForUser(auth.user.id);
    redirect(artistId ? "/dashboard" : "/onboarding");
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(6,182,212,0.3),transparent_40%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_50%,#ecfeff_100%)]" />
      <section className="relative mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid gap-8 rounded-3xl border border-white/80 bg-white/80 p-8 shadow-2xl shadow-zinc-900/10 backdrop-blur md:grid-cols-2 md:p-12">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.24em] text-indigo-600">Insight Artitico</p>
            <h1 className="text-4xl font-semibold leading-tight text-zinc-900">
              Stream analytics para artistas independentes no Brasil.
            </h1>
            <p className="text-zinc-600">
              Transforme métricas públicas do Spotify em ações estratégicas com atualização diária,
              alertas e visão histórica.
            </p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Começar agora
              </Link>
              <Link
                href="/billing"
                className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
              >
                Ver planos
              </Link>
            </div>
          </div>
          <div className="grid gap-3">
            <article className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs text-zinc-500">Taxa Streams/Ouvinte</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">2.34</p>
              <p className="mt-1 text-sm text-zinc-600">Retenção estimada acima da média</p>
            </article>
            <article className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs text-zinc-500">Tendência semanal</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600">+24.8%</p>
              <p className="mt-1 text-sm text-zinc-600">Alerta de crescimento anormal ativo</p>
            </article>
            <article className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs text-zinc-500">Ranking interno</p>
              <p className="mt-2 text-sm text-zinc-700">1. Minha Faixa Hit</p>
              <p className="text-sm text-zinc-700">2. Outra Faixa</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
