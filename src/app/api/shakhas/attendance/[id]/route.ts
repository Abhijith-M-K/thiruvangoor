import { NextResponse } from "next/server";
import { getDbClient, isDbConfigured } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
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
      DELETE FROM shakha_attendance_logs 
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, isMock: false });
  } catch (error: any) {
    console.error("Database deletion error on daily attendance log:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete log in Neon Database." },
      { status: 500 }
    );
  }
}
