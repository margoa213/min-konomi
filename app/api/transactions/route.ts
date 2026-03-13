import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET() {
  const transactions = await db.transaction.findMany({
    orderBy: { bookingDate: "desc" },
    take: 50,
  });

  return NextResponse.json(transactions);
}