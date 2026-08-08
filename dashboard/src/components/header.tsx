"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, RefreshCw } from "lucide-react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "System Overview & Analytics",
  "/repositories": "Registered Git Repositories",
  "/pipelines": "Pipeline Execution & Audit Logs",
  "/policies": "OPA Security Policy Rules",
};

export function Header() {
  const pathname = usePathname();
  const title =
    pageTitles[pathname || "/dashboard"] ||
    (pathname?.startsWith("/pipelines/") ? "Pipeline Details" : "Dashboard");

  const { data: healthData } = useQuery({
    queryKey: ["control_plane_health"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) return "offline";
        const json = await res.json();
        return json.status as "online" | "degraded" | "offline";
      } catch {
        return "offline";
      }
    },
    refetchInterval: 10000,
  });

  const cpStatus = healthData || "checking";

  return (
    <header className="h-16 border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8 ml-64">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-colors ${
            cpStatus === "online"
              ? "bg-emerald-50 border-emerald-200/80 text-emerald-700"
              : cpStatus === "degraded"
                ? "bg-amber-50 border-amber-200/80 text-amber-700"
                : cpStatus === "checking"
                  ? "bg-slate-50 border-slate-200/80 text-slate-600"
                  : "bg-rose-50 border-rose-200/80 text-rose-700"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                cpStatus === "online"
                  ? "bg-emerald-500"
                  : cpStatus === "degraded"
                    ? "bg-amber-500"
                    : cpStatus === "checking"
                      ? "bg-slate-400"
                      : "bg-rose-500"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                cpStatus === "online"
                  ? "bg-emerald-600"
                  : cpStatus === "degraded"
                    ? "bg-amber-600"
                    : cpStatus === "checking"
                      ? "bg-slate-500"
                      : "bg-rose-600"
              }`}
            />
          </span>
          <span className="text-[#86868b] font-medium">Control Plane:</span>
          <span className="font-semibold capitalize">{cpStatus}</span>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="p-2 rounded-xl bg-white border border-gray-200 text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-50 transition-colors shadow-sm"
          title="Refresh Data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <div className="p-2 rounded-xl bg-white border border-gray-200 text-[#86868b] relative shadow-sm">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#0071e3]" />
        </div>
      </div>
    </header>
  );
}
