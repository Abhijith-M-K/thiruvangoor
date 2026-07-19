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
        phone, 
        email, 
        shakha, 
        joining_date as "joiningDate", 
        status, 
        role,
        dakshina
      FROM swayamsevaks 
      ORDER BY name ASC
    `;
    
    return NextResponse.json({
      data: result,
      isMock: false
    });
  } catch (error: any) {
    console.error("Database query error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to query Neon PostgreSQL." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, email, shakha, joiningDate, status, role, dakshina } = body;

    if (!id || !name || !phone || !shakha || !status || !role) {
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
      INSERT INTO swayamsevaks (id, name, phone, email, shakha, joining_date, status, role, dakshina)
      VALUES (${id}, ${name}, ${phone}, ${email || null}, ${shakha}, ${joiningDate}, ${status}, ${role}, ${dakshina || 0})
    `;

    return NextResponse.json({ success: true, isMock: false, data: body });
  } catch (error: any) {
    console.error("Database insertion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to insert into Neon Database." },
      { status: 500 }
    );
  }
}
