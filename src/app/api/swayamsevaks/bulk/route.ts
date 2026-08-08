import { NextResponse } from "next/server";
import { getDbClient, isDbConfigured, ensureTablesExist } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { members } = body;

    if (!Array.isArray(members)) {
      return NextResponse.json(
        { error: "Invalid payload: expected an array of members" },
        { status: 400 }
      );
    }

    if (!isDbConfigured) {
      return NextResponse.json(
        { error: "Database not configured. Define DATABASE_URL in .env.local" },
        { status: 500 }
      );
    }

    const sql = getDbClient();
    if (!sql) {
      return NextResponse.json(
        { error: "Could not initialize database connection pool." },
        { status: 500 }
      );
    }

    // Auto-create tables if not exist before performing bulk insertion
    await ensureTablesExist(sql);

    // Fetch existing member names for duplicate checking by name
    const existing = await sql`
      SELECT name FROM swayamsevaks
    `;
    const existingNames = new Set(
      existing.map((r: any) => (r.name || "").trim().toUpperCase())
    );

    const toInsert: any[] = [];
    const duplicates: any[] = [];

    for (const member of members) {
      const normalizedName = (member.name || "").trim().toUpperCase();
      const nameExists = existingNames.has(normalizedName);

      if (nameExists) {
        duplicates.push(member);
      } else {
        existingNames.add(normalizedName);
        toInsert.push(member);
      }
    }

    // Insert unique records in database loop
    let insertedCount = 0;
    for (const member of toInsert) {
      const newId = member.id || `SW-${Math.floor(10000 + Math.random() * 90000)}`;
      const todayStr = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

      await sql`
        INSERT INTO swayamsevaks (id, name, phone, email, shakha, joining_date, status, role, dakshina, age)
        VALUES (
          ${newId}, 
          ${member.name.toUpperCase()}, 
          ${member.phone || ""}, 
          ${member.email || null}, 
          ${member.shakha}, 
          ${member.joiningDate || todayStr}, 
          ${member.status || "active"}, 
          ${member.role || "Swayamsevak"}, 
          0, 
          ${member.age || null}
        )
      `;
      insertedCount++;
    }

    return NextResponse.json({
      success: true,
      insertedCount,
      skippedCount: duplicates.length,
      duplicates
    });
  } catch (error: any) {
    console.error("Bulk insert error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to batch insert records." },
      { status: 500 }
    );
  }
}
