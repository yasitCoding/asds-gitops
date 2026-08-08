import {
  db,
  deployments,
  pipelineRuns,
  policyViolations,
  repositories,
  scanResults,
} from "@/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const runId = Number.parseInt(params.id, 10);
    if (Number.isNaN(runId)) {
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

    const scans = await db
      .select()
      .from(scanResults)
      .where(eq(scanResults.pipelineRunId, runId));

    const violations = await db
      .select()
      .from(policyViolations)
      .where(eq(policyViolations.pipelineRunId, runId));

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
  } catch (error: unknown) {
    console.error("Error fetching pipeline run details:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline details" },
      { status: 500 },
    );
  }
}
