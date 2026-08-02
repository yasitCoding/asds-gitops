"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-layout";
import {
  GitBranch,
  Plus,
  Copy,
  Check,
  Globe,
  Box,
  Layers,
  Key,
  ExternalLink,
  Trash2,
} from "lucide-react";

interface Repository {
  id: number;
  repoUrl: string;
  repoName: string;
  imageName: string;
  namespace: string;
  branch: string;
  testCommand: string | null;
  registeredAt: string;
  webhookSecret: string;
}

export default function RepositoriesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    repoUrl: "",
    repoName: "",
    imageName: "",
    namespace: "default",
    branch: "main",
    testCommand: "npm test",
  });

  // Fetch Repositories
  const { data: repos = [], isLoading } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: async () => {
      const res = await fetch("/api/repositories");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Delete Repository Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/repositories?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
    },
  });

  // Add Repository Mutation
  const createMutation = useMutation({
    mutationFn: async (newRepo: typeof formData) => {
      const res = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRepo),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      setIsModalOpen(false);
      setFormData({
        repoUrl: "",
        repoName: "",
        imageName: "",
        namespace: "default",
        branch: "main",
        testCommand: "npm test",
      });
    },
  });

  const handleCopySecret = (id: number, secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Action Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl apple-card">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#1d1d1f] flex items-center gap-2 tracking-tight">
              <GitBranch className="h-5 w-5 text-[#0071e3]" />
              Registered Repositories
            </h2>
            <p className="text-xs text-[#86868b]">
              Manage Git repositories connected to the GitOps Security Control
              Plane Gateway
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1d1d1f] hover:bg-black text-white font-medium text-xs shadow-sm transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Register New Repository
          </button>
        </div>

        {/* Repositories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-48 rounded-2xl bg-gray-200/50 animate-pulse"
              />
            ))}
          </div>
        ) : repos.length === 0 ? (
          <div className="p-12 text-center rounded-2xl apple-card space-y-3">
            <GitBranch className="h-10 w-10 text-[#86868b] mx-auto" />
            <h3 className="text-base font-bold text-[#1d1d1f]">
              No Repositories Registered
            </h3>
            <p className="text-xs text-[#86868b] max-w-sm mx-auto">
              Click the button above to register your first Git repository and
              enable automated security evaluation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="p-6 rounded-2xl apple-card space-y-4"
              >
                {/* Title & Branch & Delete */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[#1d1d1f]">
                        {repo.repoName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-[#0071e3] border border-blue-200">
                        {repo.branch}
                      </span>
                    </div>
                    <a
                      href={repo.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#86868b] hover:text-[#0071e3] flex items-center gap-1 font-mono"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {repo.repoUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete '${repo.repoName}'?`,
                        )
                      ) {
                        deleteMutation.mutate(repo.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2 rounded-xl text-[#86868b] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Repository"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/60 space-y-1">
                    <span className="text-[10px] text-[#86868b] uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Box className="h-3 w-3 text-[#0071e3]" /> Image Name
                    </span>
                    <p className="font-mono text-[#1d1d1f] truncate font-medium">
                      {repo.imageName}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/60 space-y-1">
                    <span className="text-[10px] text-[#86868b] uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Layers className="h-3 w-3 text-indigo-600" /> K8s
                      Namespace
                    </span>
                    <p className="font-mono text-[#1d1d1f] font-medium">
                      {repo.namespace}
                    </p>
                  </div>
                </div>

                {/* Webhook Secret Bar */}
                <div className="p-3 rounded-xl bg-gray-100/80 border border-gray-200/80 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Key className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span className="text-[#86868b] shrink-0 font-medium">
                      Webhook Secret:
                    </span>
                    <span className="font-mono text-[#1d1d1f] truncate font-medium">
                      {repo.webhookSecret}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopySecret(repo.id, repo.webhookSecret)
                    }
                    className="p-1.5 rounded-lg bg-white border border-gray-200 text-[#86868b] hover:text-[#1d1d1f] transition-colors shrink-0 shadow-sm"
                    title="Copy Secret"
                  >
                    {copiedId === repo.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Register New Repository */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-6 shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2 tracking-tight">
                  <GitBranch className="h-5 w-5 text-[#0071e3]" />
                  Register Git Repository
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#86868b] hover:text-[#1d1d1f] text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate(formData);
                }}
                className="space-y-4 text-xs"
              >
                <div className="space-y-1.5">
                  <label className="text-[#1d1d1f] font-semibold">
                    Repository URL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://github.com/org/my-app.git"
                    value={formData.repoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, repoUrl: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[#1d1d1f] placeholder:text-gray-400 focus:outline-none focus:border-[#0071e3] font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[#1d1d1f] font-semibold">
                      Repository Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="my-app"
                      value={formData.repoName}
                      onChange={(e) =>
                        setFormData({ ...formData, repoName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[#1d1d1f] placeholder:text-gray-400 focus:outline-none focus:border-[#0071e3]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[#1d1d1f] font-semibold">
                      Target Image Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="my-app-image"
                      value={formData.imageName}
                      onChange={(e) =>
                        setFormData({ ...formData, imageName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[#1d1d1f] placeholder:text-gray-400 focus:outline-none focus:border-[#0071e3] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[#1d1d1f] font-semibold">
                      Branch
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.branch}
                      onChange={(e) =>
                        setFormData({ ...formData, branch: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[#1d1d1f] font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[#1d1d1f] font-semibold">
                      K8s Namespace
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.namespace}
                      onChange={(e) =>
                        setFormData({ ...formData, namespace: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[#1d1d1f] font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#1d1d1f] font-semibold">
                    Test Command (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="npm test"
                    value={formData.testCommand}
                    onChange={(e) =>
                      setFormData({ ...formData, testCommand: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[#1d1d1f] font-mono"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1d1d1f] font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-[#1d1d1f] hover:bg-black text-white font-semibold shadow-sm disabled:opacity-50"
                  >
                    {createMutation.isPending
                      ? "Registering..."
                      : "Register Repository"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
