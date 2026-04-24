// lib/seed-demo-data-for-user.ts
import { db } from "./db";

function addMonths(date: Date, diff: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + diff);
  return copy;
}

function makeDate(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day, 12, 0, 0);
}

export async function seedDemoDataForUser(userId: string) {
  const existingAccounts = await db.account.count({
    where: { userId },
  });

  const existingTransactions = await db.transaction.count({
    where: { userId },
  });

  if (existingAccounts > 0 || existingTransactions > 0) {
    return;
  }

  const account = await db.account.create({
    data: {
      userId,
      externalAccountId: `demo-account-${userId}`,
      name: "Brukskonto",
      type: "CHECKING",
      currency: "NOK",
      balance: 85000,
    },
  });

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => addMonths(now, -(5 - i)));

  const transactions = months.flatMap((date, index) => {
    const year = date.getFullYear();
    const monthIndex = date.getMonth();

    const salary = 42000 + index * 500;
    const groceries = 4200 + index * 150;
    const transport = 900 + index * 40;
    const strøm = 1400 + (index % 2 === 0 ? 250 : -120);
    const eatingOut = 1200 + index * 120;
    const subscriptions = 499;
    const rent = 12500;
    const shopping = 800 + index * 90;
    const savingsTransfer = 10000 + index * 700;

    return [
      {
        userId,
        accountId: account.id,
        externalTxnId: `demo-${userId}-${year}-${monthIndex + 1}-salary`,
        bookingDate: makeDate(year, monthIndex, 25),
        amount: salary,
        currency: "NOK",
        description: "Lønn",
        merchantName: "Arbeidsgiver AS",
        category: "Inntekt",
        direction: "IN",
      },
      {
        userId,
        accountId: account.id,
        externalTxnId: `demo-${userId}-${year}-${monthIndex + 1}-rent`,
        bookingDate: makeDate(year, monthIndex, 1),
        amount: rent,
        currency: "NOK",
        description: "Husleie",
        merchantName: "Utleier",
        category: "Bolig",
        direction: "OUT",
      },
      {
        userId,
        accountId: account.id,
        externalTxnId: `demo-${userId}-${year}-${monthIndex + 1}-groceries`,
        bookingDate: makeDate(year, monthIndex, 5),
        amount: groceries,
        currency: "NOK",
        description: "Dagligvarer",
        merchantName: "REMA 1000",
        category: "Mat",
        direction: "OUT",
      },
      {
        userId,
        accountId: account.id,
        externalTxnId: `demo-${userId}-${year}-${monthIndex + 1}-transport`,
        bookingDate: makeDate(year, monthIndex, 7),
        amount: transport,
        currency: "NOK",
        description: "Transport",
        merchantName: "Ruter",
        category: "Transport",
        direction: "OUT",
      },
      {
        userId,
        accountId: account.id,
        externalTxnId: `demo-${userId}-${year}-${monthIndex + 1}-strom`,
        bookingDate: makeDate(year, monthIndex, 12),
        amount: strøm,
        currency: "NOK",
        description: "Strøm",
        merchantName: "Fjordkraft",
        category: "Strøm",
        direction: "OUT",
      },
      {
        userId,
        accountId: account.id,
        externalTxnId: `demo-${userId}-${year}-${monthIndex + 1}-eatingout`,
        bookingDate: makeDate(year, monthIndex, 15),
        amount: eatingOut,
        currency: "NOK",
        description: "Restaurant og kaffe",
        merchantName: "Cafe Oslo",
        category: "Spising ute",
        direction: "OUT",
      },
      {
        userId,
        accountId: account.id,
        externalTxnId: `demo-${userId}-${year}-${monthIndex + 1}-subscriptions`,
        bookingDate: makeDate(year, monthIndex, 18),
        amount: subscriptions,
        currency: "NOK",
        description: "Abonnementer",
        merchantName: "Spotify / Netflix",
        category: "Abonnement",
        direction: "OUT",
      },
      {
        userId,
        accountId: account.id,
        externalTxnId: `demo-${userId}-${year}-${monthIndex + 1}-shopping`,
        bookingDate: makeDate(year, monthIndex, 21),
        amount: shopping,
        currency: "NOK",
        description: "Diverse kjøp",
        merchantName: "Apotek / Normal",
        category: "Shopping",
        direction: "OUT",
      },
      {
        userId,
        accountId: account.id,
        externalTxnId: `demo-${userId}-${year}-${monthIndex + 1}-savings`,
        bookingDate: makeDate(year, monthIndex, 27),
        amount: savingsTransfer,
        currency: "NOK",
        description: "Overføring til sparing",
        merchantName: "Egen sparekonto",
        category: "Sparing",
        direction: "OUT",
      },
    ];
  });

  await db.transaction.createMany({
    data: transactions,
    skipDuplicates: true,
  });
}