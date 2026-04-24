import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Goa Regnskap</h1>

        <Link href="/sign-in">
          <button className="px-4 py-2 bg-black text-white rounded">
            Logg inn
          </button>
        </Link>
      </div>
    </main>
  );
}