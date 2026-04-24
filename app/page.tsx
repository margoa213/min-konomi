import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold">
          Goa Regnskap
        </h1>

        <p className="text-lg text-slate-600">
          Enkel oversikt over privatøkonomien din.
          Få innsikt, rapporter og kontroll – uten stress.
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/sign-in"
            className="px-6 py-3 rounded-lg bg-black text-white font-medium hover:opacity-90"
          >
            Logg inn
          </Link>

          <Link
            href="/reports"
            className="px-6 py-3 rounded-lg border border-slate-300 font-medium hover:bg-slate-100"
          >
            Se demo
          </Link>
        </div>
      </div>
    </main>
  );
}