import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { getOrCreateCurrentUser } from "../../lib/get-or-create-user";
import { db } from "../../lib/db";

function formatCurrency(value: number) {
  return `${value.toLocaleString("no-NO")} kr`;
}

export default async function ReportsPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await getOrCreateCurrentUser();

  const transactions = await db.transaction.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      bookingDate: "desc",
    },
    take: 10,
    select: {
      id: true,
      amount: true,
      category: true,
      description: true,
      bookingDate: true,
      direction: true,
    },
  });

  const income = transactions
    .filter((tx) => tx.direction === "in")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expenses = transactions
    .filter((tx) => tx.direction === "out")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const savings = income - expenses;

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Månedsrapport</h1>
            <p className="mt-2 text-slate-300">
              Velkommen til Goa Regnskap.
            </p>
          </div>

          <Link
            href="/transactions/new"
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            + Ny transaksjon
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Inntekter</p>
            <p className="mt-2 text-2xl font-bold text-green-400">
              {formatCurrency(income)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Utgifter</p>
            <p className="mt-2 text-2xl font-bold text-red-400">
              {formatCurrency(expenses)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Netto</p>
            <p className="mt-2 text-2xl font-bold">
              {formatCurrency(savings)}
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-slate-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">Siste transaksjoner</h2>

          {transactions.length === 0 ? (
            <p className="text-slate-400">
              Ingen transaksjoner funnet ennå.
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl bg-slate-800 p-4"
                >
                  <div>
                    <p className="font-medium">
                      {tx.description || tx.category}
                    </p>
                    <p className="text-sm text-slate-400">
                      {tx.category} ·{" "}
                      {tx.bookingDate.toLocaleDateString("no-NO")}
                    </p>
                  </div>

                  <p
                    className={
                      tx.direction === "in"
                        ? "font-bold text-green-400"
                        : "font-bold text-red-400"
                    }
                  >
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}