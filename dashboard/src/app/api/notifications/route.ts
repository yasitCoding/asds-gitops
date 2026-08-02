import { NextResponse } from "next/server";
import { db, notificationsLog } from "@/db";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const logs = await db
      .select()
      .from(notificationsLog)
      .orderBy(desc(notificationsLog.sentAt))
      .limit(50);

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("Error fetching notifications log:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications log" },
      { status: 500 },
    );
  }
}
