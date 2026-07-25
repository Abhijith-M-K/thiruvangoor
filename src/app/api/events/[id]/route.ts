import { NextResponse } from "next/server";
import { getDbClient, isDbConfigured } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, eventDate, place, informedCount, participantCount, absentCount, absentReasonCount } = body;

    if (!name || !eventDate || !place || informedCount === undefined || participantCount === undefined || absentCount === undefined || absentReasonCount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    await sql`
      UPDATE events
      SET 
        name = ${name},
        event_date = ${eventDate},
        place = ${place},
        informed_count = ${informedCount},
        participant_count = ${participantCount},
        absent_count = ${absentCount},
        absent_reason_count = ${absentReasonCount}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, isMock: false, data: { id, ...body } });
  } catch (error: any) {
    console.error("Database update error on events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update event in Neon Database." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;

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

    await sql`
      DELETE FROM events
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, isMock: false });
  } catch (error: any) {
    console.error("Database deletion error on events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete event in Neon Database." },
      { status: 500 }
    );
  }
}
