import Link from "next/link";
import { redirect } from "next/navigation";
import { getLinkedArtistIdForUser, getOptionalAuthContext } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const auth = await getOptionalAuthContext();
  if (auth) {
    const artistId = await getLinkedArtistIdForUser(auth.user.id);
    redirect(artistId ? "/dashboard" : "/onboarding");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/5 md:grid-cols-2">
        <div className="flex flex-col justify-between bg-gradient-to-br from-indigo-600 via-sky-600 to-cyan-500 p-8 text-white">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-white/80">Insight Artitico</p>
            <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
              Métricas públicas em decisões estratégicas.
            </h1>
          </div>
          <p className="text-sm text-white/90">
            Acesse com link mágico, conecte seu artista e veja evolução diária de streams.
          </p>
        </div>
        <div className="space-y-6 p-8">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Entrar</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Você receberá um link de acesso sem senha.
            </p>
          </div>
          <LoginForm />
          <p className="text-xs text-zinc-500">
            Ao continuar, você concorda com nossos{" "}
            <Link href="#" className="underline">
              termos
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
