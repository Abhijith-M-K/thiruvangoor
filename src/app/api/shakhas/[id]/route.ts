import { NextResponse } from "next/server";
import { getDbClient, isDbConfigured, ensureTablesExist } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, time, location, mukhyaShikshak, attendance } = body;

    if (!name || !type || !time || !location || !mukhyaShikshak) {
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
      UPDATE shakhas 
      SET 
        name = ${name}, 
        type = ${type}, 
        time = ${time}, 
        location = ${location}, 
        mukhya_shikshak = ${mukhyaShikshak}, 
        attendance = ${attendance || 0}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, isMock: false });
  } catch (error: any) {
    console.error("Database update error on shakhas:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update shakha session in Neon Database." },
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
      DELETE FROM shakhas 
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, isMock: false });
  } catch (error: any) {
    console.error("Database deletion error on shakhas:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete shakha session in Neon Database." },
      { status: 500 }
    );
  }
}
