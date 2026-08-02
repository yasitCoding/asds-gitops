import { NextResponse } from "next/server";
import { db, pipelineRuns, repositories } from "@/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const runs = await db
      .select({
        id: pipelineRuns.id,
        commitHash: pipelineRuns.commitHash,
        triggeredAt: pipelineRuns.triggeredAt,
        status: pipelineRuns.status,
        imageTag: pipelineRuns.imageTag,
        testStatus: pipelineRuns.testStatus,
        scanSummary: pipelineRuns.scanSummary,
        repoName: repositories.repoName,
        repoUrl: repositories.repoUrl,
      })
      .from(pipelineRuns)
      .leftJoin(repositories, eq(pipelineRuns.repositoryId, repositories.id))
      .orderBy(desc(pipelineRuns.triggeredAt));

    return NextResponse.json(runs);
  } catch (error: any) {
    console.error("Error fetching pipeline runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline runs" },
      { status: 500 },
    );
  }
}
