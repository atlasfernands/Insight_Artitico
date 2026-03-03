import { redirect } from "next/navigation";
import { getLinkedArtistIdForUser, requireAuthContext } from "@/lib/auth/session";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const auth = await requireAuthContext();
  const linkedArtistId = await getLinkedArtistIdForUser(auth.user.id);
  if (linkedArtistId) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-12">
      <section className="w-full rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-900/5">
        <p className="text-xs uppercase tracking-[0.24em] text-indigo-600">Onboarding</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          Conecte seu primeiro artista
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-600">
          Cole a URL ou ID do artista no Spotify. Seu plano MVP suporta 1 artista por conta.
        </p>
        <div className="mt-8">
          <OnboardingForm />
        </div>
      </section>
    </main>
  );
}
