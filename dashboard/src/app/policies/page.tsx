"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-layout";
import {
  ShieldCheck,
  ShieldAlert,
  Code2,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PolicyRule {
  id: number;
  ruleName: string;
  regoCode: string;
  description: string | null;
  enabled: boolean;
}

export default function PoliciesPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Fetch OPA Policy Rules
  const { data: rules = [], isLoading } = useQuery<PolicyRule[]>({
    queryKey: ["policy_rules"],
    queryFn: async () => {
      const res = await fetch("/api/policies");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Toggle Policy Rule Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const res = await fetch("/api/policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy_rules"] });
    },
  });

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Action Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl apple-card">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#1d1d1f] flex items-center gap-2 tracking-tight">
              <ShieldCheck className="h-5 w-5 text-[#0071e3]" />
              OPA Security Policy Rules Engine
            </h2>
            <p className="text-xs text-[#86868b]">
              Configure and toggle active Open Policy Agent (Rego) compliance
              checks in real-time
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-[#1d1d1f] font-mono">
              Active Rules:{" "}
              <strong className="text-emerald-600">
                {rules.filter((r) => r.enabled).length}
              </strong>{" "}
              / {rules.length}
            </span>
          </div>
        </div>

        {/* Rules Grid */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-28 rounded-2xl bg-gray-200/50 animate-pulse"
              />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center rounded-2xl apple-card space-y-2 text-xs text-[#86868b]">
            <ShieldAlert className="h-8 w-8 text-gray-300 mx-auto" />
            <p>No OPA policy rules configured in database.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={cn(
                  "rounded-2xl apple-card transition-all duration-200 overflow-hidden",
                  rule.enabled ? "opacity-100" : "opacity-60 bg-gray-50/50",
                )}
              >
                {/* Rule Header Row */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                        rule.enabled
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-gray-100 text-gray-400 border-gray-200",
                      )}
                    >
                      {rule.enabled ? (
                        <ShieldCheck className="h-5 w-5" />
                      ) : (
                        <ShieldAlert className="h-5 w-5" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#1d1d1f] tracking-tight">
                          {rule.ruleName}
                        </h3>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            rule.enabled
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-[#86868b] border-gray-200",
                          )}
                        >
                          {rule.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-xs text-[#86868b] truncate">
                        {rule.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Toggle & Expand Rego Code */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Rego Code Drawer Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(rule.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-[#1d1d1f] hover:bg-gray-100 text-xs font-semibold transition-colors"
                    >
                      <Code2 className="h-3.5 w-3.5 text-[#0071e3]" />
                      <span>Rego Code</span>
                      {expandedId === rule.id ? (
                        <ChevronUp className="h-3.5 w-3.5 text-[#86868b]" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-[#86868b]" />
                      )}
                    </button>

                    {/* Interactive Enable/Disable Toggle Button */}
                    <button
                      type="button"
                      disabled={toggleMutation.isPending}
                      onClick={() =>
                        toggleMutation.mutate({
                          id: rule.id,
                          enabled: !rule.enabled,
                        })
                      }
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all duration-200 border shadow-sm",
                        rule.enabled
                          ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                          : "bg-gray-100 text-[#86868b] border-gray-200 hover:bg-gray-200",
                      )}
                    >
                      {rule.enabled ? (
                        <>
                          <ToggleRight className="h-4 w-4 text-white" />
                          <span>Enabled</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4 text-[#86868b]" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Rego Code Block */}
                {expandedId === rule.id && (
                  <div className="border-t border-gray-200 bg-[#161618] p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="font-mono text-emerald-400 flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5" /> policy_rules.rego_code
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Open Policy Agent DSL
                      </span>
                    </div>
                    <pre className="p-4 rounded-xl bg-[#0d0d0e] border border-gray-800 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                      {rule.regoCode}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
