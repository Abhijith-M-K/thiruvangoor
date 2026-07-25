import { NextResponse } from "next/server";
import { getDbClient, isDbConfigured, ensureTablesExist } from "@/lib/db";

export async function GET() {
  if (!isDbConfigured) {
    return NextResponse.json(
      { error: "Vercel Neon Database is not configured." },
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
    await ensureTablesExist(sql);

    const result = await sql`
      SELECT 
        id, 
        name, 
        event_date as "eventDate", 
        place, 
        informed_count as "informedCount", 
        participant_count as "participantCount", 
        absent_count as "absentCount", 
        absent_reason_count as "absentReasonCount"
      FROM events 
      ORDER BY event_date DESC, name ASC
    `;
    
    return NextResponse.json({
      data: result,
      isMock: false
    });
  } catch (error: any) {
    console.error("Database query error on events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to query Neon PostgreSQL." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, eventDate, place, informedCount, participantCount, absentCount, absentReasonCount } = body;

    if (!name || !eventDate || !place || informedCount === undefined || participantCount === undefined || absentCount === undefined || absentReasonCount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields for event registration" },
        { status: 400 }
      );
    }

    if (!isDbConfigured) {
      return NextResponse.json(
        { error: "Vercel Neon Database is not configured." },
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

    await ensureTablesExist(sql);

    const id = `EV-${Math.floor(1000 + Math.random() * 9000)}`;

    await sql`
      INSERT INTO events (id, name, event_date, place, informed_count, participant_count, absent_count, absent_reason_count)
      VALUES (${id}, ${name}, ${eventDate}, ${place}, ${informedCount}, ${participantCount}, ${absentCount}, ${absentReasonCount})
    `;

    return NextResponse.json({ success: true, isMock: false, data: { id, ...body } });
  } catch (error: any) {
    console.error("Database insertion error on events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to insert event into Neon Database." },
      { status: 500 }
    );
  }
}
