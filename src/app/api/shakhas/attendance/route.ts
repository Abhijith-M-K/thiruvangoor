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
        l.id,
        l.shakha_id as "shakhaId",
        l.log_date as "logDate",
        l.present_count as "presentCount",
        l.absent_count as "absentCount",
        l.absent_reason_count as "absentReasonCount",
        l.remarks,
        s.name as "shakhaName"
      FROM shakha_attendance_logs l
      JOIN shakhas s ON l.shakha_id = s.id
      ORDER BY l.id DESC
    `;
    
    return NextResponse.json({
      data: result,
      isMock: false
    });
  } catch (error: any) {
    console.error("Database query error on daily attendance logs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to query Neon PostgreSQL." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shakhaId, logDate, presentCount, absentCount, absentReasonCount, remarks } = body;

    if (!shakhaId || !logDate || presentCount === undefined || absentCount === undefined || absentReasonCount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: shakhaId, logDate, presentCount, absentCount, absentReasonCount" },
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

    const id = `LOG-${Math.floor(1000 + Math.random() * 9000)}`;

    await sql`
      INSERT INTO shakha_attendance_logs (id, shakha_id, log_date, present_count, absent_count, absent_reason_count, remarks)
      VALUES (${id}, ${shakhaId}, ${logDate}, ${presentCount}, ${absentCount}, ${absentReasonCount}, ${remarks || null})
    `;

    return NextResponse.json({ success: true, isMock: false, data: { id, ...body } });
  } catch (error: any) {
    console.error("Database insertion error on daily attendance log:", error);
    return NextResponse.json(
      { error: error.message || "Failed to insert daily log into Neon Database." },
      { status: 500 }
    );
  }
}
