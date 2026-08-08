"use client";

import { cn } from "@/lib/utils";
import {
  GitBranch,
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Repositories",
    href: "/repositories",
    icon: GitBranch,
  },
  {
    name: "Pipeline Runs",
    href: "/pipelines",
    icon: Workflow,
  },
  {
    name: "OPA Policies",
    href: "/policies",
    icon: ShieldCheck,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-200/80 bg-white flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100">
        <div className="h-9 w-9 rounded-xl bg-[#1d1d1f] flex items-center justify-center shadow-sm">
          <ShieldAlert className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-[#1d1d1f] tracking-tight">
            GitOps SecEngine
          </span>
          <span className="text-[10px] text-[#86868b] tracking-wider uppercase font-semibold">
            CSC492 Control Plane
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-[#86868b] tracking-wider uppercase">
          Navigation
        </div>
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-[#1d1d1f] text-white shadow-sm font-semibold"
                  : "text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-100/70",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-[#86868b] group-hover:text-[#1d1d1f]",
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3.5 m-3 rounded-xl bg-gray-50 border border-gray-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-mono text-[#1d1d1f]">
            FastAPI Gateway
          </span>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          v1.0.0
        </span>
      </div>
    </aside>
  );
}
