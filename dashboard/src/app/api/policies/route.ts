import { NextResponse } from "next/server";
import { db, policyRules } from "@/db";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const rules = await db
      .select()
      .from(policyRules)
      .orderBy(asc(policyRules.id));

    return NextResponse.json(rules);
  } catch (error: any) {
    console.error("Error fetching policy rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch policy rules" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, enabled } = body;

    if (id === undefined || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields (id, enabled)" },
        { status: 400 },
      );
    }

    const updated = await db
      .update(policyRules)
      .set({ enabled })
      .where(eq(policyRules.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("Error updating policy rule:", error);
    return NextResponse.json(
      { error: "Failed to update policy rule" },
      { status: 500 },
    );
  }
}
