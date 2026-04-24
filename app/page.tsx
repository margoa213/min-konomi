import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Goa Regnskap
          </Link>

          <nav className="flex items-center gap-3">
            {userId ? (
              <>
                <Link
                  href="/reports"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Gå til rapporter
                </Link>
                <Link
                  href="/transactions/new"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Ny transaksjon
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Logg inn
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Kom i gang
                </Link>
              </>
            )}
          </nav>
        </header>

        <div className="flex flex-1 items-center py-16">
          <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 shadow-sm">
                Norsk MVP for privatøkonomi
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Få bedre oversikt over privatøkonomien din.
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                Goa Regnskap gjør transaksjonene dine om til månedlige rapporter,
                økonomisk innsikt og PDF-oversikter du faktisk kan bruke.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {userId ? (
                  <>
                    <Link
                      href="/reports"
                      className="rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      Åpne rapportene mine
                    </Link>
                    <Link
                      href="/transactions/new"
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Registrer transaksjon
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/sign-up"
                      className="rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      Kom i gang
                    </Link>
                    <Link
                      href="/sign-in"
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Jeg har allerede bruker
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    Månedlige rapporter
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Se inntekter, utgifter, sparing og utvikling over tid.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    Smart innsikt
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Få anbefalinger og en enkel score basert på økonomien din.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    PDF på ett klikk
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Last ned en ryddig rapport for måneden direkte fra appen.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="grid gap-4">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Denne måneden</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    Bedre oversikt
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Registrer transaksjoner manuelt, se siste bevegelser og bygg
                    rapporter på ekte data.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm text-slate-500">Rapportmotor</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      Inntekter, utgifter, sparing
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Månedlige nøkkeltall og sammenligning med forrige periode.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm text-slate-500">Transaksjoner</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      Opprett, rediger og slett
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Enkel CRUD-flyt som gjør MVP-en faktisk brukbar.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 p-5">
                  <p className="text-sm font-medium text-slate-700">
                    Klar for produksjon
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Neste steg er eget domene, produksjonskontroll av Clerk og en
                    siste gjennomgang av rapport- og PDF-flyten.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="border-t border-slate-200 py-6">
          <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Goa Regnskap</p>
            <div className="flex gap-4">
              <Link href="/sign-in" className="hover:text-slate-700">
                Logg inn
              </Link>
              <Link href="/sign-up" className="hover:text-slate-700">
                Kom i gang
              </Link>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}