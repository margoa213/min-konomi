import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateCurrentUser } from "@/lib/get-or-create-user";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await getOrCreateCurrentUser();
    const body = await req.json();

    console.log("transactions POST body:", body);

    const { amount, category, description, bookingDate, direction } = body;

    if (
      amount === undefined ||
      amount === null ||
      !category ||
      !bookingDate ||
      !direction
    ) {
      return NextResponse.json(
        {
          error: "Mangler påkrevde felt",
          received: { amount, category, bookingDate, direction },
        },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount)) {
      return NextResponse.json(
        { error: "Beløp må være et gyldig tall" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(bookingDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          error: "Ugyldig datoformat. Bruk YYYY-MM-DD.",
          receivedBookingDate: bookingDate,
        },
        { status: 400 }
      );
    }

    const normalizedDirection = String(direction).trim().toLowerCase();

    if (normalizedDirection !== "in" && normalizedDirection !== "out") {
      return NextResponse.json(
        {
          error: "Ugyldig direction. Bruk 'in' eller 'out'.",
          receivedDirection: direction,
        },
        { status: 400 }
      );
    }

    const account = await db.account.findFirst({
      where: {
        userId: currentUser.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Ingen konto funnet for bruker." },
        { status: 400 }
      );
    }

    const transaction = await db.transaction.create({
      data: {
        user: {
          connect: {
            id: currentUser.id,
          },
        },
        account: {
          connect: {
            id: account.id,
          },
        },
        amount: numericAmount,
        category: category.trim(),
        description: description?.trim() || "",
        bookingDate: parsedDate,
        direction: normalizedDirection,
        externalTxnId: crypto.randomUUID(),
      },
    });

    console.log("transaction created:", transaction.id);

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error("POST /api/transactions failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Serverfeil ved lagring av transaksjon",
      },
      { status: 500 }
    );
  }
}