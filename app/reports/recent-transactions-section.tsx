"use client";

import { useRouter } from "next/navigation";

type RecentTransaction = {
  id: string;
  amount: number;
  category: string | null;
  description: string | null;
  bookingDate: Date | string;
  direction: string | null;
};

function formatCurrency(value: number) {
  return `${value.toLocaleString("no-NO")} kr`;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("no-NO");
}

export function RecentTransactionsSection({
  transactions,
}: {
  transactions: RecentTransaction[];
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Slette denne transaksjonen?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Delete failed:", data);
        alert(data?.error || "Kunne ikke slette transaksjon.");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Delete request crashed:", error);
      alert("Nettverksfeil ved sletting av transaksjon.");
    }
  }

  return (
    <section
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      <h2
        style={{
          fontSize: 30,
          fontWeight: 700,
          marginBottom: 20,
          color: "#ffffff",
        }}
      >
        Siste transaksjoner
      </h2>

      {transactions.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.65)" }}>
          Ingen transaksjoner registrert ennå.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {transactions.map((transaction) => {
            const isIncome =
              String(transaction.direction ?? "").trim().toLowerCase() === "in";

            return (
              <div
                key={transaction.id}
                style={{
                  background: "#0a0a0a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "16px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#ffffff",
                      marginBottom: 4,
                    }}
                  >
                    {transaction.category || "Ukjent kategori"}
                  </div>

                  <div
                    style={{
                      color: "rgba(255,255,255,0.68)",
                      fontSize: 14,
                      marginBottom: 6,
                    }}
                  >
                    {transaction.description?.trim() || "Ingen beskrivelse"}
                  </div>

                  <div
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 13,
                    }}
                  >
                    {formatDate(transaction.bookingDate)}
                  </div>
                </div>

                <div style={{ textAlign: "right", minWidth: 140 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: isIncome ? "#4ade80" : "#f87171",
                    }}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(Math.abs(Number(transaction.amount)))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(transaction.id)}
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: "#f87171",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Slett
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}