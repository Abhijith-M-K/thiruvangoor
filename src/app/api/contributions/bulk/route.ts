import { NextResponse } from "next/server";
import { getDbClient, isDbConfigured, ensureTablesExist } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contributions } = body;

    if (!Array.isArray(contributions)) {
      return NextResponse.json(
        { error: "Invalid payload: expected an array of contributions" },
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

    await ensureTablesExist(sql);

    // Fetch existing contributions to do duplicate checking
    const existing = await sql`
      SELECT name, swayamsevak_id as "swayamsevakId", amount, contribution_date as "contributionDate" 
      FROM contributions
    `;
    
    // Create a Set of unique string identifiers for duplicate checking
    // Format: "name_amount_date"
    const existingSet = new Set(
      existing.map(
        (c: any) => `${c.name.toUpperCase().trim()}_${c.amount}_${c.contributionDate.trim()}`
      )
    );

    // Fetch all existing swayamsevaks to map matching phones
    const swayamsevaks = await sql`
      SELECT id, name, phone, shakha FROM swayamsevaks
    `;
    // Create a lookup map of phone -> swayamsevak
    const swayamsevakLookup = new Map();
    swayamsevaks.forEach((s: any) => {
      const cleanPhone = s.phone.replace(/[^0-9]/g, "");
      if (cleanPhone) {
        swayamsevakLookup.set(cleanPhone, s);
      }
    });

    const toInsert: any[] = [];
    const duplicates: any[] = [];

    for (const item of contributions) {
      let linkedId = null;
      let finalName = item.name ? item.name.toUpperCase().trim() : "";
      let finalShakha = item.shakha || "Pravaudh Shakha";

      // Try matching by phone
      if (item.phone) {
        const cleanPhone = String(item.phone).replace(/[^0-9]/g, "");
        const matched = swayamsevakLookup.get(cleanPhone);
        if (matched) {
          linkedId = matched.id;
          finalName = matched.name;
          finalShakha = matched.shakha;
        }
      }

      const todayStr = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      const finalDate = item.date || todayStr;
      const finalAmount = parseInt(item.amount, 10) || 0;

      // Duplicate check key
      const key = `${finalName}_${finalAmount}_${finalDate.trim()}`;

      if (existingSet.has(key)) {
        duplicates.push({ ...item, name: finalName, date: finalDate });
      } else {
        toInsert.push({
          swayamsevakId: linkedId,
          name: finalName,
          shakha: finalShakha,
          amount: finalAmount,
          date: finalDate
        });
        // Add to existingSet to prevent duplicates within the uploaded file itself
        existingSet.add(key);
      }
    }

    // Insert records
    let insertedCount = 0;
    for (const c of toInsert) {
      const newId = `CON-${Math.floor(10000 + Math.random() * 90000)}`;

      await sql`
        INSERT INTO contributions (id, swayamsevak_id, name, shakha, contribution_date, amount)
        VALUES (${newId}, ${c.swayamsevakId || null}, ${c.name}, ${c.shakha}, ${c.date}, ${c.amount})
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
    console.error("Bulk contribution insert error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to batch insert contribution records." },
      { status: 500 }
    );
  }
}
