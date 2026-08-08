"use client";

import { AppLayout } from "@/components/app-layout";
import { getRemediationGuide } from "@/lib/remediation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Bug,
  Check,
  CheckCircle2,
  GitBranch,
  ShieldAlert,
  Terminal,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface PipelineDetail {
  id: number;
  commitHash: string;
  triggeredAt: string;
  status: string;
  imageTag: string;
  testStatus: string | null;
  testOutput: string | null;
  scanSummary: Record<string, unknown> | null;
  repoName: string;
  repoUrl: string;
  namespace: string;
  scanResults: Array<{
    id: number;
    scannerName: string;
    severity: string;
    cveId: string;
    packageName: string;
    installedVersion: string | null;
    fixedVersion: string | null;
    description: string | null;
  }>;
  violations: Array<{
    id: number;
    violationDetail: string;
    createdAt: string;
  }>;
  deployment: {
    argocdAppName: string;
    deploymentStatus: string;
    clusterNamespace: string;
    deployedAt: string;
  } | null;
}

export default function PipelineDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const {
    data: run,
    isLoading,
    error,
  } = useQuery<PipelineDetail>({
    queryKey: ["pipeline_detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/pipelines/${id}`);
      if (!res.ok) throw new Error("Failed to load details");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-xs text-[#86868b]">
          Loading pipeline details...
        </div>
      </AppLayout>
    );
  }

  if (error || !run) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-xs text-rose-600 font-semibold">
          Failed to load pipeline run details.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link
          href="/pipelines"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Pipeline Runs
        </Link>

        <div className="p-6 rounded-2xl apple-card space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#1d1d1f] font-mono tracking-tight">
                  Pipeline Run #{run.id}
                </h2>
                <span className="text-xs font-mono text-[#86868b]">
                  Commit:{" "}
                  <span className="text-[#0071e3] font-bold">
                    {run.commitHash}
                  </span>
                </span>
              </div>
              <p className="text-xs text-[#86868b] flex items-center gap-2">
                <GitBranch className="h-3.5 w-3.5 text-[#86868b]" />
                {run.repoName} ({run.namespace}) • Triggered At:{" "}
                {new Date(run.triggeredAt).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 border border-gray-200 text-[#1d1d1f]">
                {run.status}
              </span>
            </div>
          </div>

          {run.deployment && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4 text-xs text-emerald-800">
              <div className="flex items-center gap-2 font-mono font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  GitOps ArgoCD App:{" "}
                  <strong className="font-bold">
                    {run.deployment.argocdAppName}
                  </strong>{" "}
                  (Namespace: {run.deployment.clusterNamespace})
                </span>
              </div>
              <span className="font-mono text-[11px] text-emerald-700">
                Synced:{" "}
                {new Date(run.deployment.deployedAt).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {run.violations.length > 0 && (
          <div className="p-6 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-4">
            <h3 className="text-base font-bold text-rose-700 flex items-center gap-2 tracking-tight">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              OPA Policy Violations ({run.violations.length}) & Remediation
              Guide
            </h3>

            <div className="space-y-4">
              {run.violations.map((v) => {
                const guide = getRemediationGuide(v.violationDetail);
                return (
                  <div
                    key={v.id}
                    className="p-5 rounded-xl bg-white border border-rose-200/80 space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                          <XCircle className="h-4 w-4 text-rose-600" />
                          {v.violationDetail}
                        </span>
                        <p className="text-xs text-[#86868b]">
                          {guide.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" /> {guide.title}
                      </span>
                      <pre className="p-3 rounded-lg bg-[#161618] border border-gray-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                        {guide.snippet}
                      </pre>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-6 rounded-2xl apple-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1d1d1f] flex items-center gap-2 tracking-tight">
              <Bug className="h-5 w-5 text-amber-500" />
              Vulnerability Scan Results (Trivy)
            </h3>
            <span className="text-xs font-mono text-[#86868b]">
              Total Vulnerabilities: {run.scanResults.length}
            </span>
          </div>

          {run.scanResults.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#86868b] rounded-xl bg-gray-50 border border-gray-200/60 flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              No vulnerability issues found in image scan.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-[#86868b] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">CVE ID</th>
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Installed</th>
                    <th className="py-3 px-4">Fixed Version</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                  {run.scanResults.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.severity === "CRITICAL"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : item.severity === "HIGH"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-gray-100 text-[#86868b]"
                          }`}
                        >
                          {item.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#0071e3] font-bold">
                        {item.cveId}
                      </td>
                      <td className="py-3 px-4 text-[#1d1d1f] font-bold">
                        {item.packageName}
                      </td>
                      <td className="py-3 px-4 text-[#86868b]">
                        {item.installedVersion || "-"}
                      </td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">
                        {item.fixedVersion || "None"}
                      </td>
                      <td className="py-3 px-4 text-[#86868b] font-sans truncate max-w-xs">
                        {item.description || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {run.testOutput && (
          <div className="p-6 rounded-2xl apple-card space-y-3">
            <h3 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2 tracking-tight">
              <Terminal className="h-4 w-4 text-emerald-600" />
              Unit Test Output Log
            </h3>
            <pre className="p-4 rounded-xl bg-[#161618] border border-gray-800 font-mono text-xs text-gray-200 overflow-x-auto leading-relaxed">
              {run.testOutput}
            </pre>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
