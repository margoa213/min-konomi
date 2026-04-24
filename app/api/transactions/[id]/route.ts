import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateCurrentUser } from "@/lib/get-or-create-user";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await getOrCreateCurrentUser();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Mangler transaksjons-ID" },
        { status: 400 }
      );
    }

    const transaction = await db.transaction.findFirst({
      where: {
        id,
        userId: currentUser.id,
      },
      select: {
        id: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksjon ikke funnet eller tilhører ikke brukeren" },
        { status: 404 }
      );
    }

    await db.transaction.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kunne ikke slette transaksjon",
      },
      { status: 500 }
    );
  }
}