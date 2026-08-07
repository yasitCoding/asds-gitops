import { db, notificationsLog } from "@/db";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const logs = await db
      .select()
      .from(notificationsLog)
      .orderBy(desc(notificationsLog.sentAt))
      .limit(50);

    return NextResponse.json(logs);
  } catch (error: unknown) {
    console.error("Error fetching notifications log:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications log" },
      { status: 500 },
    );
  }
}
