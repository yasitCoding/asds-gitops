import { randomBytes } from "node:crypto";
import { db, repositories } from "@/db";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const repositoryListFields = {
  id: repositories.id,
  repoUrl: repositories.repoUrl,
  repoName: repositories.repoName,
  imageName: repositories.imageName,
  namespace: repositories.namespace,
  branch: repositories.branch,
  testCommand: repositories.testCommand,
  registeredAt: repositories.registeredAt,
} as const;

export async function GET() {
  try {
    const allRepos = await db
      .select(repositoryListFields)
      .from(repositories)
      .orderBy(desc(repositories.registeredAt));

    return NextResponse.json(allRepos);
  } catch (error: unknown) {
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
        webhookSecret: `whsec_${randomBytes(32).toString("hex")}`,
      })
      .returning();

    return NextResponse.json(newRepo[0], { status: 201 });
  } catch (error: unknown) {
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

    const id = Number.parseInt(idParam, 10);
    await db.delete(repositories).where(eq(repositories.id, id));

    return NextResponse.json({
      success: true,
      message: `Repository #${id} deleted`,
    });
  } catch (error: unknown) {
    console.error("Error deleting repository:", error);
    return NextResponse.json(
      { error: "Failed to delete repository" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const id = Number(idParam);
    if (!idParam || !Number.isInteger(id)) {
      return NextResponse.json(
        { error: "Valid repository ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const updates = {
      repoUrl: body.repoUrl,
      repoName: body.repoName,
      imageName: body.imageName,
      namespace: body.namespace,
      branch: body.branch,
      testCommand: body.testCommand || null,
    };
    if (
      !updates.repoUrl ||
      !updates.repoName ||
      !updates.imageName ||
      !updates.namespace ||
      !updates.branch
    ) {
      return NextResponse.json(
        {
          error:
            "Repository URL, name, image, namespace, and branch are required",
        },
        { status: 400 },
      );
    }

    const updated = await db
      .update(repositories)
      .set(updates)
      .where(eq(repositories.id, id))
      .returning(repositoryListFields);
    if (!updated[0]) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(updated[0]);
  } catch (error: unknown) {
    console.error("Error updating repository:", error);
    return NextResponse.json(
      { error: "Failed to update repository" },
      { status: 500 },
    );
  }
}
