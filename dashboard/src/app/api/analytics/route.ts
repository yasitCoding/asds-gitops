import { db, deployments, pipelineRuns, repositories, scanResults } from "@/db";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Total Pipeline Runs count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pipelineRuns);
    const totalPipelines = Number(totalResult[0]?.count || 0);

    // 2. Passed & Deployed count
    const passedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pipelineRuns)
      .where(sql`${pipelineRuns.status} IN ('passed', 'deployed')`);
    const passedCount = Number(passedResult[0]?.count || 0);

    // 3. Failed count
    const failedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pipelineRuns)
      .where(
        sql`${pipelineRuns.status} IN ('test_failed', 'scan_failed', 'policy_failed', 'failed')`,
      );
    const failedCount = Number(failedResult[0]?.count || 0);

    const passRate =
      totalPipelines > 0
        ? Math.round((passedCount / totalPipelines) * 100)
        : 100;

    // 4. Active Deployments count
    const deploymentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(deployments)
      .where(eq(deployments.deploymentStatus, "synced"));
    const activeDeployments = Number(deploymentsResult[0]?.count || 0);

    // 5. CVE Severities breakdown
    const cveSeverities = await db
      .select({
        severity: scanResults.severity,
        count: sql<number>`count(*)`,
      })
      .from(scanResults)
      .groupBy(scanResults.severity);

    const cveDistribution = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    for (const item of cveSeverities) {
      const sev = item.severity.toUpperCase() as keyof typeof cveDistribution;
      if (cveDistribution[sev] !== undefined) {
        cveDistribution[sev] = Number(item.count);
      }
    }

    // 6. Top 5 Most Common CVEs
    const topCVEs = await db
      .select({
        cveId: scanResults.cveId,
        packageName: scanResults.packageName,
        severity: scanResults.severity,
        count: sql<number>`count(*)`,
      })
      .from(scanResults)
      .groupBy(scanResults.cveId, scanResults.packageName, scanResults.severity)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    const pipelineTrend = await db
      .select({
        date: sql<string>`date_trunc('day', ${pipelineRuns.triggeredAt})`,
        passed: sql<number>`sum(case when ${pipelineRuns.status} in ('passed', 'deployed') then 1 else 0 end)`,
        failed: sql<number>`sum(case when ${pipelineRuns.status} in ('test_failed', 'scan_failed', 'policy_failed', 'failed') then 1 else 0 end)`,
      })
      .from(pipelineRuns)
      .groupBy(sql`date_trunc('day', ${pipelineRuns.triggeredAt})`)
      .orderBy(sql`date_trunc('day', ${pipelineRuns.triggeredAt})`)
      .limit(14);

    // 8. Top 5 Recent Pipeline Executions with Repo name
    const recentPipelines = await db
      .select({
        id: pipelineRuns.id,
        commitHash: pipelineRuns.commitHash,
        triggeredAt: pipelineRuns.triggeredAt,
        status: pipelineRuns.status,
        imageTag: pipelineRuns.imageTag,
        repoName: repositories.repoName,
      })
      .from(pipelineRuns)
      .leftJoin(repositories, eq(pipelineRuns.repositoryId, repositories.id))
      .orderBy(desc(pipelineRuns.triggeredAt))
      .limit(5);

    return NextResponse.json({
      totalPipelines,
      passedCount,
      failedCount,
      passRate,
      activeDeployments,
      cveDistribution,
      topCVEs,
      pipelineTrend,
      recentPipelines,
    });
  } catch (error: unknown) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 },
    );
  }
}
