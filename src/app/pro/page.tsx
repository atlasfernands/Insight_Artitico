import Link from "next/link";

export default function ProPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-indigo-200 bg-white p-8 shadow-xl shadow-indigo-900/5">
        <p className="text-xs uppercase tracking-[0.24em] text-indigo-600">PRO</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Em breve</h1>
        <p className="mt-3 text-sm text-zinc-700">
          A integração OAuth com Spotify for Artists já está planejada para a fase 2.
        </p>
        <Link
          href="/billing"
          className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Ver status do plano
        </Link>
      </section>
    </main>
  );
}
