import Link from "next/link";

interface AuthErrorPageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-red-200 bg-white p-6 shadow-xl shadow-red-900/5">
        <h1 className="text-xl font-semibold text-zinc-900">Erro de autenticação</h1>
        <p className="mt-3 text-sm text-zinc-700">
          {params.message ?? "Não foi possível concluir o login."}
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Tentar novamente
        </Link>
      </section>
    </main>
  );
}
