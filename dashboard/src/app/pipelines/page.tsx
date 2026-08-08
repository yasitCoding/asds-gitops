"use client";

import { AppLayout } from "@/components/app-layout";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  History,
  ShieldAlert,
  Workflow,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface PipelineRun {
  id: number;
  commitHash: string;
  triggeredAt: string;
  status: string;
  imageTag: string;
  testStatus: string | null;
  scanSummary: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
    total?: number;
  } | null;
  repoName: string | null;
  repoUrl: string | null;
}

interface NotificationLogItem {
  id: number;
  pipelineRunId: number;
  channel: string;
  sentAt: string;
  messageContent: string;
}

export default function PipelinesPage() {
  const [activeTab, setActiveTab] = useState<"pipelines" | "audit">(
    "pipelines",
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: runs = [], isLoading: isLoadingRuns } = useQuery<PipelineRun[]>(
    {
      queryKey: ["pipeline_runs"],
      queryFn: async () => {
        const res = await fetch("/api/pipelines");
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      },
    },
  );

  const { data: auditLogs = [], isLoading: isLoadingAudit } = useQuery<
    NotificationLogItem[]
  >({
    queryKey: ["notifications_log"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const filteredRuns = runs.filter((run) => {
    if (statusFilter === "ALL") return true;
    return run.status === statusFilter;
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "deployed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Deployed
          </span>
        );
      case "passed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0071e3] border border-blue-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#0071e3]" /> Passed
          </span>
        );
      case "test_failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Test Failed
          </span>
        );
      case "scan_failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> Scan Failed
          </span>
        );
      case "policy_failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="h-3.5 w-3.5 text-red-600" /> Policy Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-[#86868b] border border-gray-200 animate-pulse">
            <Clock className="h-3.5 w-3.5" /> {status}
          </span>
        );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl apple-card">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-100 border border-gray-200/60">
            <button
              type="button"
              onClick={() => setActiveTab("pipelines")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                activeTab === "pipelines"
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#86868b] hover:text-[#1d1d1f]",
              )}
            >
              <Workflow className="h-3.5 w-3.5" />
              Pipeline Runs ({runs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                activeTab === "audit"
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#86868b] hover:text-[#1d1d1f]",
              )}
            >
              <History className="h-3.5 w-3.5" />
              Audit Event Logs ({auditLogs.length})
            </button>
          </div>

          {activeTab === "pipelines" && (
            <div className="flex items-center gap-2 text-xs">
              <Filter className="h-3.5 w-3.5 text-[#86868b]" />
              <span className="text-[#86868b] font-medium">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="deployed">Deployed</option>
                <option value="passed">Passed</option>
                <option value="test_failed">Test Failed</option>
                <option value="scan_failed">Scan Failed</option>
                <option value="policy_failed">Policy Failed</option>
                <option value="running">Running</option>
              </select>
            </div>
          )}
        </div>

        {activeTab === "pipelines" && (
          <div className="rounded-2xl apple-card overflow-hidden">
            {isLoadingRuns ? (
              <div className="p-8 text-center text-xs text-[#86868b]">
                Loading pipeline executions...
              </div>
            ) : filteredRuns.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#86868b] space-y-2">
                <Workflow className="h-8 w-8 text-gray-300 mx-auto" />
                <p>No pipeline runs found for the selected filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200/80 text-[#86868b] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">ID & Commit</th>
                      <th className="py-3.5 px-6">Repository</th>
                      <th className="py-3.5 px-6">Image Tag</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">CVE Summary</th>
                      <th className="py-3.5 px-6">Triggered At</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRuns.map((run) => (
                      <tr
                        key={run.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <td className="py-4 px-6 font-mono">
                          <span className="text-[#0071e3] font-bold">
                            #{run.id}
                          </span>{" "}
                          <span className="text-[#86868b]">
                            ({run.commitHash.substring(0, 7)})
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-[#1d1d1f]">
                          {run.repoName || "Default Repo"}
                        </td>
                        <td className="py-4 px-6 font-mono text-[#1d1d1f]">
                          {run.imageTag}
                        </td>
                        <td className="py-4 px-6">
                          {renderStatusBadge(run.status)}
                        </td>
                        <td className="py-4 px-6">
                          {run.scanSummary ? (
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              {run.scanSummary.critical ? (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                                  C:{run.scanSummary.critical}
                                </span>
                              ) : null}
                              {run.scanSummary.high ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                                  H:{run.scanSummary.high}
                                </span>
                              ) : null}
                              {!run.scanSummary.critical &&
                                !run.scanSummary.high && (
                                  <span className="text-emerald-600 font-semibold">
                                    Clean
                                  </span>
                                )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-[#86868b]">
                          {new Date(run.triggeredAt).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/pipelines/${run.id}`}
                            className="inline-flex items-center gap-1 text-[#0071e3] hover:underline font-semibold"
                          >
                            Details <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "audit" && (
          <div className="rounded-2xl apple-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2 tracking-tight">
              <BellRing className="h-4 w-4 text-[#0071e3]" />
              Notifications & Pipeline State Transition History
            </h3>
            {isLoadingAudit ? (
              <div className="p-8 text-center text-xs text-[#86868b]">
                Loading audit logs...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#86868b]">
                No audit logs recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200/60 flex items-start justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white text-[#1d1d1f] border border-gray-200 font-semibold shadow-sm">
                          {log.channel}
                        </span>
                        <span className="font-mono text-[#0071e3] font-bold">
                          Run #{log.pipelineRunId}
                        </span>
                      </div>
                      <p className="text-[#1d1d1f] font-mono leading-relaxed">
                        {log.messageContent}
                      </p>
                    </div>
                    <span className="text-[#86868b] shrink-0 font-mono text-[11px]">
                      {new Date(log.sentAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
