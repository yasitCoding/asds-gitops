"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import {
  Workflow,
  ShieldCheck,
  Layers,
  Bug,
  ArrowUpRight,
  TrendingUp,
  Activity,
  ShieldAlert,
} from "lucide-react";

interface AnalyticsData {
  totalPipelines: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  activeDeployments: number;
  cveDistribution: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  topCVEs: Array<{
    cveId: string;
    packageName: string;
    severity: string;
    count: number;
  }>;
  recentPipelines: Array<{
    id: number;
    commitHash: string;
    triggeredAt: string;
    status: string;
    imageTag: string;
    repoName: string | null;
  }>;
}

export default function DashboardOverviewPage() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics_summary"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "deployed":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Deployed
          </span>
        );
      case "passed":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0071e3] border border-blue-200">
            Passed
          </span>
        );
      case "test_failed":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Test Failed
          </span>
        );
      case "scan_failed":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Scan Failed
          </span>
        );
      case "policy_failed":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            Policy Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-[#86868b]">
            {status}
          </span>
        );
    }
  };

  if (isLoading || !analytics) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-xs text-[#86868b]">
          Loading system overview analytics...
        </div>
      </AppLayout>
    );
  }

  const totalCVEs =
    analytics.cveDistribution.CRITICAL +
    analytics.cveDistribution.HIGH +
    analytics.cveDistribution.MEDIUM +
    analytics.cveDistribution.LOW;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Metric Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Pipelines */}
          <div className="p-5 rounded-2xl apple-card space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                Total Runs
              </span>
              <div className="p-2 rounded-xl bg-gray-100 text-[#1d1d1f]">
                <Workflow className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold text-[#1d1d1f] font-mono tracking-tight">
                {analytics.totalPipelines}
              </span>
              <p className="text-[11px] text-[#86868b] pt-1">
                Evaluated by OPA Engine
              </p>
            </div>
          </div>

          {/* Card 2: Pass Rate */}
          <div className="p-5 rounded-2xl apple-card space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                Compliance Pass Rate
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-[#0071e3]">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#1d1d1f] font-mono tracking-tight">
                  {analytics.passRate}%
                </span>
                <span className="text-xs text-emerald-600 flex items-center font-semibold">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> High
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-gray-100 mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-[#0071e3] rounded-full transition-all duration-500"
                  style={{ width: `${analytics.passRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Active Deployments */}
          <div className="p-5 rounded-2xl apple-card space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                ArgoCD Deployments
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#1d1d1f] font-mono tracking-tight">
                  {analytics.activeDeployments}
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
              </div>
              <p className="text-[11px] text-[#86868b] pt-1">
                Synced to K8s Cluster
              </p>
            </div>
          </div>

          {/* Card 4: Vulnerabilities Blocked */}
          <div className="p-5 rounded-2xl apple-card space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                Vulnerabilities
              </span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <Bug className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold text-[#1d1d1f] font-mono tracking-tight">
                {totalCVEs}
              </span>
              <p className="text-[11px] text-[#86868b] pt-1 flex items-center gap-2">
                <span className="text-rose-600 font-semibold">
                  Critical: {analytics.cveDistribution.CRITICAL}
                </span>
                <span>•</span>
                <span className="text-amber-600 font-semibold">
                  High: {analytics.cveDistribution.HIGH}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Two-Column Analytics Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 cols): Recent Executions Timeline & Status */}
          <div className="lg:col-span-2 p-6 rounded-2xl apple-card space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2 tracking-tight">
                <Activity className="h-4 w-4 text-[#0071e3]" />
                Real-time Pipeline Executions & Deployment Status
              </h3>
              <Link
                href="/pipelines"
                className="text-xs text-[#0071e3] hover:underline flex items-center gap-1 font-semibold"
              >
                View All <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {analytics.recentPipelines.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#86868b]">
                No pipeline executions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {analytics.recentPipelines.map((run) => (
                  <div
                    key={run.id}
                    className="py-3 flex items-center justify-between gap-4 text-xs hover:bg-gray-50/80 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="font-mono shrink-0">
                        <span className="text-[#0071e3] font-bold">
                          #{run.id}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#1d1d1f] truncate">
                          {run.repoName || "Repository"}
                        </p>
                        <p className="font-mono text-[11px] text-[#86868b] truncate">
                          {run.imageTag} • {run.commitHash.substring(0, 7)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {renderStatusBadge(run.status)}
                      <span className="text-[#86868b] font-mono text-[11px]">
                        {new Date(run.triggeredAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (1 col): CVE Severity Distribution & Top CVEs */}
          <div className="p-6 rounded-2xl apple-card space-y-5">
            <h3 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2 border-b border-gray-100 pb-3 tracking-tight">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              CVE Severity Analytics Breakdown
            </h3>

            {/* Severity Bars */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-rose-600 font-semibold">CRITICAL</span>
                  <span className="text-[#1d1d1f] font-bold">
                    {analytics.cveDistribution.CRITICAL}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all"
                    style={{
                      width: `${
                        totalCVEs > 0
                          ? (analytics.cveDistribution.CRITICAL / totalCVEs) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-amber-600 font-semibold">HIGH</span>
                  <span className="text-[#1d1d1f] font-bold">
                    {analytics.cveDistribution.HIGH}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{
                      width: `${
                        totalCVEs > 0
                          ? (analytics.cveDistribution.HIGH / totalCVEs) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-[#0071e3] font-semibold">MEDIUM</span>
                  <span className="text-[#1d1d1f] font-bold">
                    {analytics.cveDistribution.MEDIUM}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-[#0071e3] rounded-full transition-all"
                    style={{
                      width: `${
                        totalCVEs > 0
                          ? (analytics.cveDistribution.MEDIUM / totalCVEs) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Top 5 Common CVEs */}
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                Top Frequent CVEs
              </span>
              {analytics.topCVEs.length === 0 ? (
                <p className="text-xs text-[#86868b]">
                  No CVEs detected in recent scans.
                </p>
              ) : (
                <div className="space-y-2">
                  {analytics.topCVEs.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="truncate">
                        <span className="text-[#0071e3] font-bold block truncate">
                          {item.cveId}
                        </span>
                        <span className="text-[#86868b] text-[10px] block truncate">
                          {item.packageName}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white text-[#1d1d1f] border border-gray-200 text-[11px] font-bold shadow-sm">
                        {item.count}x
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
