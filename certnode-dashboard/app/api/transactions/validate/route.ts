import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateTransaction } from "@/lib/transactions";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.enterpriseId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const amountCents = Number(body?.amountCents ?? 0);

    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return NextResponse.json(
        { error: "amountCents must be a positive integer" },
        { status: 400 },
      );
    }

    const result = await validateTransaction({
      enterpriseId: session.user.enterpriseId,
      amountCents: Math.round(amountCents),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("validate transaction", error);
    return NextResponse.json({ error: "unable to validate transaction" }, { status: 500 });
  }
}
