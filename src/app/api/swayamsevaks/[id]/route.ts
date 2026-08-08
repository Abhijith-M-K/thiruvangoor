import { NextResponse } from "next/server";
import { getDbClient, isDbConfigured } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, shakha, status, role, dakshina, age } = body;

    if (!name || !shakha || !status || !role) {
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

    await sql`
      UPDATE swayamsevaks 
      SET 
        name = ${name}, 
        phone = ${phone || ""}, 
        email = ${email || null}, 
        shakha = ${shakha}, 
        status = ${status}, 
        role = ${role},
        dakshina = ${dakshina || 0},
        age = ${age || null}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, isMock: false });
  } catch (error: any) {
    console.error("Database update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update record in Neon Database." },
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

    await sql`
      DELETE FROM swayamsevaks 
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, isMock: false });
  } catch (error: any) {
    console.error("Database deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete record in Neon Database." },
      { status: 500 }
    );
  }
}
