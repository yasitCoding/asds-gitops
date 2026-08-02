import { NextResponse } from "next/server";
import { db, repositories } from "@/db";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allRepos = await db
      .select()
      .from(repositories)
      .orderBy(desc(repositories.registeredAt));

    return NextResponse.json(allRepos);
  } catch (error: any) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      repoUrl,
      repoName,
      imageName,
      namespace,
      branch = "main",
      testCommand,
      webhookSecret = "whsec_" + Math.random().toString(36).substring(2, 15),
    } = body;

    if (!repoUrl || !repoName || !imageName || !namespace) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (repoUrl, repoName, imageName, namespace)",
        },
        { status: 400 },
      );
    }

    const newRepo = await db
      .insert(repositories)
      .values({
        repoUrl,
        repoName,
        imageName,
        namespace,
        branch,
        testCommand: testCommand || null,
        webhookSecret,
      })
      .returning();

    return NextResponse.json(newRepo[0], { status: 201 });
  } catch (error: any) {
    console.error("Error creating repository:", error);
    return NextResponse.json(
      { error: "Failed to register repository" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 },
      );
    }

    const id = parseInt(idParam, 10);
    const { eq } = await import("drizzle-orm");
    await db.delete(repositories).where(eq(repositories.id, id));

    return NextResponse.json({
      success: true,
      message: `Repository #${id} deleted`,
    });
  } catch (error: any) {
    console.error("Error deleting repository:", error);
    return NextResponse.json(
      { error: "Failed to delete repository" },
      { status: 500 },
    );
  }
}
