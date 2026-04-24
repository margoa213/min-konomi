"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const expenseCategories = [
  "Mat",
  "Transport",
  "Bolig",
  "Abonnement",
  "Underholdning",
  "Helse",
  "Shopping",
  "Reise",
  "Regninger",
  "Annet",
];

const incomeCategories = [
  "Lønn",
  "Bonus",
  "Freelance",
  "Refusjon",
  "Salg",
  "Gave",
  "Annet",
];

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function NewTransactionPage() {
  const router = useRouter();

  const [direction, setDirection] = useState<"in" | "out">("out");
  const [amount, setAmount] = useState("");
  const [categoryMode, setCategoryMode] = useState<"preset" | "custom">("preset");
  const [category, setCategory] = useState("Mat");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [bookingDate, setBookingDate] = useState(getTodayIsoDate());
  const [loading, setLoading] = useState(false);

  const categoryOptions = useMemo(() => {
    return direction === "in" ? incomeCategories : expenseCategories;
  }, [direction]);

  const activeCategory =
    categoryMode === "custom" ? customCategory.trim() : category.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!activeCategory) {
      alert("Velg eller skriv inn en kategori.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          category: activeCategory,
          description,
          bookingDate,
          direction,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Save failed:", data);
        alert(data?.error || "Noe gikk galt ved lagring av transaksjon.");
        return;
      }

      router.push("/reports");
      router.refresh();
    } catch (error) {
      console.error("Transaction request crashed:", error);
      alert("Nettverksfeil ved lagring av transaksjon.");
    } finally {
      setLoading(false);
    }
  }

  function handleDirectionChange(nextDirection: "in" | "out") {
    setDirection(nextDirection);
    setCategoryMode("preset");
    setCategory(nextDirection === "in" ? incomeCategories[0] : expenseCategories[0]);
    setCustomCategory("");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #111827 0%, #050505 45%, #000000 100%)",
        color: "#ffffff",
        padding: "48px 24px 80px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Ny transaksjon
          </h1>
          <p
            style={{
              marginTop: 10,
              fontSize: 18,
              color: "rgba(255,255,255,0.68)",
            }}
          >
            Registrer en inntekt eller utgift manuelt.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "#111111",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            display: "grid",
            gap: 18,
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 10,
                fontSize: 14,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              Type
            </label>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleDirectionChange("out")}
                style={{
                  background: direction === "out" ? "#dc2626" : "#171717",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14,
                  padding: "12px 16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Utgift
              </button>

              <button
                type="button"
                onClick={() => handleDirectionChange("in")}
                style={{
                  background: direction === "in" ? "#16a34a" : "#171717",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14,
                  padding: "12px 16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Inntekt
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="amount"
              style={{
                display: "block",
                marginBottom: 10,
                fontSize: 14,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              Beløp
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={direction === "in" ? "f.eks. 25000" : "f.eks. 499"}
              required
              style={{
                width: "100%",
                background: "#0a0a0a",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "14px 16px",
                fontSize: 16,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 10,
                fontSize: 14,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              Kategori
            </label>

            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setCategoryMode("preset")}
                style={{
                  background: categoryMode === "preset" ? "#2563eb" : "#171717",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Velg fra liste
              </button>

              <button
                type="button"
                onClick={() => setCategoryMode("custom")}
                style={{
                  background: categoryMode === "custom" ? "#2563eb" : "#171717",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Skriv egen
              </button>
            </div>

            {categoryMode === "preset" ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  background: "#0a0a0a",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: "14px 16px",
                  fontSize: 16,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option} style={{ color: "#000000" }}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Skriv kategori"
                required={categoryMode === "custom"}
                style={{
                  width: "100%",
                  background: "#0a0a0a",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: "14px 16px",
                  fontSize: 16,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              style={{
                display: "block",
                marginBottom: 10,
                fontSize: 14,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              Beskrivelse
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Valgfritt"
              style={{
                width: "100%",
                background: "#0a0a0a",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "14px 16px",
                fontSize: 16,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="bookingDate"
              style={{
                display: "block",
                marginBottom: 10,
                fontSize: 14,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              Dato
            </label>
            <input
              id="bookingDate"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              required
              style={{
                width: "100%",
                background: "#0a0a0a",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "14px 16px",
                fontSize: 16,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#2563eb",
                border: "1px solid rgba(147,197,253,0.35)",
                color: "#ffffff",
                padding: "12px 18px",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Lagrer..." : "Lagre transaksjon"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/reports")}
              style={{
                background: "#171717",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#ffffff",
                padding: "12px 18px",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}