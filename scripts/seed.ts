import "dotenv/config";
import { db } from "../lib/db";
import { categorizeTransaction } from "../lib/categorize";

type DemoTransaction = {
  id: string;
  text: string;
  amount: number;
  date: string;
};

async function main() {
  console.log("Starter seed...");

  const user = await db.user.upsert({
    where: { email: "test@privatregnskap.no" },
    update: {},
    create: {
      clerkUserId: "seed-test-user", // ✅ FIX
      email: "test@privatregnskap.no",
      name: "Testbruker",
    },
  });

  const account = await db.account.upsert({
    where: { externalAccountId: "demo-account-1" },
    update: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      externalAccountId: "demo-account-1",
      name: "Brukskonto",
      type: "checking",
      currency: "NOK",
      balance: 25000,
    },
  });

  const demoTransactions: DemoTransaction[] = [
    { id: "jan-1", text: "LØNN ACME AS", amount: 40000, date: "2026-01-25" },
    { id: "jan-2", text: "TIBBER", amount: -1399, date: "2026-01-06" },
    { id: "jan-3", text: "REMA 1000", amount: -920, date: "2026-01-08" },
    { id: "jan-4", text: "KIWI", amount: -845, date: "2026-01-17" },
    { id: "jan-5", text: "VY", amount: -799, date: "2026-01-09" },
    { id: "jan-6", text: "RUTER", amount: -814, date: "2026-01-22" },
    { id: "jan-7", text: "FOODORA", amount: -389, date: "2026-01-13" },
    { id: "jan-8", text: "NETFLIX", amount: -159, date: "2026-01-15" },

    { id: "feb-1", text: "LØNN ACME AS", amount: 42000, date: "2026-02-25" },
    { id: "feb-2", text: "TIBBER", amount: -1149, date: "2026-02-18" },
    { id: "feb-3", text: "REMA 1000", amount: -864, date: "2026-02-26" },
    { id: "feb-4", text: "RUTER", amount: -879, date: "2026-02-20" },
    { id: "feb-5", text: "FOODORA", amount: -312, date: "2026-02-19" },

    { id: "mar-1", text: "LØNN ACME AS", amount: 42000, date: "2026-03-25" },
    { id: "mar-2", text: "TIBBER", amount: -990, date: "2026-03-07" },
    { id: "mar-3", text: "REMA 1000", amount: -1200, date: "2026-03-10" },
    { id: "mar-4", text: "RUTER", amount: -814, date: "2026-03-15" },
    { id: "mar-5", text: "SATS", amount: -499, date: "2026-03-11" },

    { id: "apr-1", text: "LØNN ACME AS", amount: 43000, date: "2026-04-25" },
    { id: "apr-2", text: "TIBBER", amount: -1050, date: "2026-04-06" },
    { id: "apr-3", text: "REMA 1000", amount: -980, date: "2026-04-14" },
    { id: "apr-4", text: "RUTER", amount: -814, date: "2026-04-20" },
    { id: "apr-5", text: "FOODORA", amount: -450, date: "2026-04-12" },

    { id: "mai-1", text: "LØNN ACME AS", amount: 43000, date: "2026-05-25" },
    { id: "mai-2", text: "TIBBER", amount: -899, date: "2026-05-05" },
    { id: "mai-3", text: "REMA 1000", amount: -1300, date: "2026-05-08" },
    { id: "mai-4", text: "RUTER", amount: -879, date: "2026-05-19" },
    { id: "mai-5", text: "SAS", amount: -1999, date: "2026-05-21" },

    { id: "jun-1", text: "LØNN ACME AS", amount: 44000, date: "2026-06-25" },
    { id: "jun-2", text: "TIBBER", amount: -850, date: "2026-06-03" },
    { id: "jun-3", text: "REMA 1000", amount: -1100, date: "2026-06-09" },
    { id: "jun-4", text: "RUTER", amount: -879, date: "2026-06-15" },
    { id: "jun-5", text: "SOMMERFERIE", amount: -3500, date: "2026-06-18" },
  ];

  for (const tx of demoTransactions) {
    await db.transaction.upsert({
      where: { externalTxnId: tx.id },
      update: {},
      create: {
        userId: user.id,
        accountId: account.id,
        externalTxnId: tx.id,
        bookingDate: new Date(tx.date),
        amount: tx.amount,
        currency: "NOK",
        description: tx.text,
        merchantName: tx.text,
        category: categorizeTransaction(tx.text, tx.amount),
        direction: tx.amount >= 0 ? "in" : "out",
      },
    });
  }

  console.log("Seed fullført ✅");
}

main()
  .catch((error) => {
    console.error("Seed feilet:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });