import { NextResponse } from "next/server";
import {
  db,
  pipelineRuns,
  repositories,
  scanResults,
  policyViolations,
  deployments,
} from "@/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const runId = parseInt(params.id, 10);
    if (isNaN(runId)) {
      return NextResponse.json(
        { error: "Invalid pipeline ID" },
        { status: 400 },
      );
    }

    const runDetails = await db
      .select({
        id: pipelineRuns.id,
        repositoryId: pipelineRuns.repositoryId,
        commitHash: pipelineRuns.commitHash,
        triggeredAt: pipelineRuns.triggeredAt,
        status: pipelineRuns.status,
        imageTag: pipelineRuns.imageTag,
        testStatus: pipelineRuns.testStatus,
        testOutput: pipelineRuns.testOutput,
        scanSummary: pipelineRuns.scanSummary,
        repoName: repositories.repoName,
        repoUrl: repositories.repoUrl,
        namespace: repositories.namespace,
      })
      .from(pipelineRuns)
      .leftJoin(repositories, eq(pipelineRuns.repositoryId, repositories.id))
      .where(eq(pipelineRuns.id, runId));

    if (!runDetails.length) {
      return NextResponse.json(
        { error: "Pipeline run not found" },
        { status: 404 },
      );
    }

    const run = runDetails[0];

    // Fetch related scan results
    const scans = await db
      .select()
      .from(scanResults)
      .where(eq(scanResults.pipelineRunId, runId));

    // Fetch related policy violations
    const violations = await db
      .select()
      .from(policyViolations)
      .where(eq(policyViolations.pipelineRunId, runId));

    // Fetch deployment details if exists
    const deploymentList = await db
      .select()
      .from(deployments)
      .where(eq(deployments.pipelineRunId, runId));

    return NextResponse.json({
      ...run,
      scanResults: scans,
      violations,
      deployment: deploymentList[0] || null,
    });
  } catch (error: any) {
    console.error("Error fetching pipeline run details:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline details" },
      { status: 500 },
    );
  }
}
