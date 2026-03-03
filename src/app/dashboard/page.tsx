import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthContext, getLinkedArtistIdForUser } from "@/lib/auth/session";
import {
  loadAlertsByUserId,
  loadOverviewByUserId,
  loadTracksByUserId,
} from "@/lib/dashboard/queries";
import { formatNumber, formatPercent } from "@/lib/ui/format";
import { SignOutButton } from "./SignOutButton";

function confidenceLabel(value: string | null) {
  if (value === "high") return "Alta";
  if (value === "medium") return "Média";
  if (value === "low") return "Baixa";
  return "--";
}

function trendLabel(value: string | null) {
  if (value === "up") return "Alta";
  if (value === "down") return "Queda";
  if (value === "stable") return "Estável";
  return "--";
}

export default async function DashboardPage() {
  const auth = await requireAuthContext();
  const artistId = await getLinkedArtistIdForUser(auth.user.id);
  if (!artistId) {
    redirect("/onboarding");
  }

  const [overview, tracks, alerts] = await Promise.all([
    loadOverviewByUserId(auth.user.id),
    loadTracksByUserId(auth.user.id, 30),
    loadAlertsByUserId(auth.user.id, 30),
  ]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-600">Dashboard</p>
          <h1 className="text-2xl font-semibold text-zinc-900">Visão estratégica diária</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Atualizado em {overview.snapshotDate ?? "--"} • Confiança{" "}
            {confidenceLabel(overview.dataConfidence)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/billing"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            {overview.plan === "pro" ? "Plano PRO" : "Upgrade PRO"}
          </Link>
          <SignOutButton />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Total de Streams</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {formatNumber(overview.totalStreams)}
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Ouvintes Mensais</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {formatNumber(overview.monthlyListeners)}
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Seguidores</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {formatNumber(overview.followers)}
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Crescimento Semanal</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {formatPercent(overview.weeklyGrowthPct)}
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Tendência</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {trendLabel(overview.trendStatus)}
          </p>
        </article>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Métricas derivadas</h2>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex justify-between text-zinc-700">
              <span>Streams / Ouvinte</span>
              <span className="font-semibold text-zinc-900">
                {overview.streamsPerListener?.toFixed(2) ?? "--"}
              </span>
            </p>
            <p className="flex justify-between text-zinc-700">
              <span>Índice de Retenção (estimado)</span>
              <span className="font-semibold text-zinc-900">
                {overview.retentionIndexEst?.toFixed(2) ?? "--"}
              </span>
            </p>
            <p className="flex justify-between text-zinc-700">
              <span>Índice de Engajamento</span>
              <span className="font-semibold text-zinc-900">
                {overview.engagementIndex?.toFixed(2) ?? "--"}
              </span>
            </p>
            <p className="flex justify-between text-zinc-700">
              <span>Música mais ouvida</span>
              <span className="max-w-[220px] truncate font-semibold text-zinc-900">
                {overview.topTrackName ?? "--"}
              </span>
            </p>
          </div>
          <p className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-800">
            Recursos avançados PRO (OAuth Spotify for Artists) já estão preparados e entram na
            fase 2.
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Ranking interno de músicas</h2>
          <div className="mt-4 overflow-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Faixa</th>
                  <th className="py-2 text-right">Streams (estimado)</th>
                </tr>
              </thead>
              <tbody>
                {tracks.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-zinc-500">
                      Sem dados de faixas para o período.
                    </td>
                  </tr>
                ) : (
                  tracks.map((track) => (
                    <tr key={track.spotifyTrackId} className="border-t border-zinc-100">
                      <td className="py-2 pr-2 font-semibold text-zinc-800">{track.rankPosition}</td>
                      <td className="py-2 pr-2 text-zinc-700">{track.trackName}</td>
                      <td className="py-2 text-right font-medium text-zinc-900">
                        {formatNumber(track.trackStreamsEstimated)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Alertas (dashboard)</h2>
        <ul className="mt-4 space-y-3">
          {alerts.length === 0 ? (
            <li className="text-sm text-zinc-500">Nenhum alerta nos últimos 30 dias.</li>
          ) : (
            alerts.map((alert) => (
              <li
                key={alert.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-zinc-900">{alert.title}</p>
                  <span className="text-xs uppercase tracking-wide text-zinc-500">
                    {alert.snapshotDate}
                  </span>
                </div>
                <p className="mt-1 text-zinc-700">{alert.description}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
