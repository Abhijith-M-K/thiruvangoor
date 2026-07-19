import { NextResponse } from "next/server";
import { getDbClient, isDbConfigured, ensureTablesExist } from "@/lib/db";

export async function GET() {
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

  try {
    // Auto-create tables if not exist before performing the query
    await ensureTablesExist(sql);

    const result = await sql`
      SELECT 
        id, 
        name, 
        type, 
        time, 
        location, 
        mukhya_shikshak as "mukhyaShikshak", 
        attendance
      FROM shakhas 
      ORDER BY id ASC
    `;
    
    return NextResponse.json({
      data: result,
      isMock: false
    });
  } catch (error: any) {
    console.error("Database query error on shakhas:", error);
    return NextResponse.json(
      { error: error.message || "Failed to query Neon PostgreSQL." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, type, time, location, mukhyaShikshak, attendance } = body;

    if (!id || !name || !type || !time || !location || !mukhyaShikshak) {
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

    // Auto-create tables if not exist before performing the insert
    await ensureTablesExist(sql);

    await sql`
      INSERT INTO shakhas (id, name, type, time, location, mukhya_shikshak, attendance)
      VALUES (${id}, ${name}, ${type}, ${time}, ${location}, ${mukhyaShikshak}, ${attendance || 0})
    `;

    return NextResponse.json({ success: true, isMock: false, data: body });
  } catch (error: any) {
    console.error("Database insertion error on shakhas:", error);
    return NextResponse.json(
      { error: error.message || "Failed to insert shakha into Neon Database." },
      { status: 500 }
    );
  }
}
