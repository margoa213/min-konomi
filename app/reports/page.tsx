import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../lib/db";
import { getOrCreateCurrentUser } from "../../lib/get-or-create-user";

export default async function ReportsPage() {
  const { userId } = await auth();

  // Ikke logget inn → send til login
  if (!userId) {
    redirect("/sign-in");
  }

  // Hent / opprett bruker i DB
  const user = await getOrCreateCurrentUser();

  // TypeScript fix + sikkerhet
  if (!user) {
    redirect("/sign-in");
  }

  // Hent noen transactions (enkelt for nå)
  const transactions = await db.transaction.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      bookingDate: "desc",
    },
    take: 5,
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 40,
        background: "#0a0a0a",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 20 }}>
        Reports fungerer 🎉
      </h1>

      <p style={{ marginBottom: 20 }}>
        Du er logget inn som bruker: {user.id}
      </p>

      <h2 style={{ marginBottom: 10 }}>Siste transaksjoner</h2>

      {transactions.length === 0 ? (
        <p>Ingen data enda</p>
      ) : (
        <ul style={{ display: "grid", gap: 10 }}>
          {transactions.map((t) => (
            <li
              key={t.id}
              style={{
                padding: 12,
                border: "1px solid #333",
                borderRadius: 8,
              }}
            >
              {t.description ?? "Ukjent"} – {t.amount} kr
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}