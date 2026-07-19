import { NextResponse } from "next/server";
import { getDbClient, isDbConfigured, ensureTablesExist } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { swayamsevakId, name, shakha, contributionDate, amount } = body;

    if (!name || !shakha || !contributionDate || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isDbConfigured) {
      return NextResponse.json(
        { error: "Vercel Neon Database is not configured. Define DATABASE_URL in your .env.local file." },
        { status: 500 }
      );
    }

    const sql = getDbClient();
    if (!sql) {
      return NextResponse.json(
        { error: "Could not initialize database pool client connection." },
        { status: 500 }
      );
    }

    // Auto-create tables if not exist before performing the update
    await ensureTablesExist(sql);

    await sql`
      UPDATE contributions 
      SET 
        swayamsevak_id = ${swayamsevakId || null},
        name = ${name}, 
        shakha = ${shakha}, 
        contribution_date = ${contributionDate}, 
        amount = ${amount}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, isMock: false });
  } catch (error: any) {
    console.error("Database update error on contributions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update contribution record in Neon Database." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    if (!isDbConfigured) {
      return NextResponse.json(
        { error: "Vercel Neon Database is not configured. Define DATABASE_URL in your .env.local file." },
        { status: 500 }
      );
    }

    const sql = getDbClient();
    if (!sql) {
      return NextResponse.json(
        { error: "Could not initialize database pool client connection." },
        { status: 500 }
      );
    }

    // Auto-create tables if not exist before performing the delete
    await ensureTablesExist(sql);

    await sql`
      DELETE FROM contributions 
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, isMock: false });
  } catch (error: any) {
    console.error("Database deletion error on contributions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete contribution record in Neon Database." },
      { status: 500 }
    );
  }
}
