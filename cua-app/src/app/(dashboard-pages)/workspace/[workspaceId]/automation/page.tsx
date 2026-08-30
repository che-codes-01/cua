"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiClock,
  FiCpu,
  FiEdit2,
  FiGlobe,
  FiMoreHorizontal,
  FiPlus,
  FiTrash2,
  FiZap,
} from "react-icons/fi";

import { Button } from "@/components/ui/button";

type Workflow = {
  id: string;
  name: string;
  nodes: unknown[];
  runner_id: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  runners: {
    id: string;
    name: string;
    status: string;
  } | null;
};

type Workspace = {
  id: string;
  name: string;
  slug: string;
};

export default function WorkflowsListPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Load workspace info and workflows
  useEffect(() => {
    if (!workspaceId) return;

    async function loadData() {
      setLoading(true);
      try {
        // Get workspace info
        const wsRes = await fetch("/api/dashboard/workspaces");
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          const ws = wsData.workspaces?.find((w: Workspace) => w.id === workspaceId);
          if (ws) setWorkspace(ws);
        }

        // Get workflows
        const res = await fetch(`/api/workflows/list?workspaceId=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setWorkflows(data.workflows || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [workspaceId]);

  async function deleteWorkflow(workflowId: string) {
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    try {
      const res = await fetch(`/api/workflows/delete?id=${workflowId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));
      }
    } catch (e) {
      console.error(e);
    }
    setMenuOpenId(null);
  }

  function createNewWorkflow() {
    router.push(`/workspace/${workspaceId}/automation/editor`);
  }

  function editWorkflow(workflowId: string) {
    router.push(`/workspace/${workspaceId}/automation/editor?id=${workflowId}`);
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-white/[0.06] px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-white/40 hover:text-white"
          >
            <FiArrowLeft className="size-4" />
          </button>
          <div className="h-5 w-px bg-white/[0.06]" />
          <div className="flex items-center gap-2">
            <FiZap className="size-4 text-white/40" />
            <span className="text-sm font-medium text-white/80">Workflows</span>
          </div>
          {workspace && (
            <>
              <div className="h-5 w-px bg-white/[0.06]" />
              <span className="text-xs text-white/30">{workspace.name}</span>
            </>
          )}
        </div>

        <Button
          onClick={createNewWorkflow}
          className="h-9 bg-white px-4 text-sm text-black hover:bg-white/90"
        >
          <FiPlus className="mr-2 size-4" />
          New Workflow
        </Button>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Your Workflows
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Create and manage automation workflows for your workspace
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/30">Loading workflows...</div>
          </div>
        ) : workflows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-16 text-center">
            <FiZap className="mx-auto size-10 text-white/10" />
            <h3 className="mt-4 text-sm font-medium text-white/50">No workflows yet</h3>
            <p className="mt-2 text-xs text-white/30">
              Create your first workflow to automate tasks
            </p>
            <Button
              onClick={createNewWorkflow}
              className="mt-6 h-9 bg-white px-4 text-sm text-black hover:bg-white/90"
            >
              <FiPlus className="mr-2 size-4" />
              Create Workflow
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-white/10 hover:bg-white/[0.03]"
              >
                {/* Status badge */}
                <div className="mb-3 flex items-center justify-between">
                  {workflow.published ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400">
                      <FiGlobe className="size-3" />
                      Published
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/[0.04] px-2 py-1 text-[10px] text-white/30">
                      Draft
                    </span>
                  )}

                  {/* Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === workflow.id ? null : workflow.id)}
                      className="rounded p-1 text-white/20 opacity-0 transition hover:bg-white/[0.04] hover:text-white/60 group-hover:opacity-100"
                    >
                      <FiMoreHorizontal className="size-4" />
                    </button>

                    {menuOpenId === workflow.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setMenuOpenId(null)}
                        />
                        <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-white/[0.08] bg-[#111] py-1 shadow-xl">
                          <button
                            onClick={() => editWorkflow(workflow.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/[0.04] hover:text-white"
                          >
                            <FiEdit2 className="size-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteWorkflow(workflow.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400/60 hover:bg-red-400/5 hover:text-red-400"
                          >
                            <FiTrash2 className="size-3.5" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h3
                  onClick={() => editWorkflow(workflow.id)}
                  className="cursor-pointer text-sm font-medium text-white/80 hover:text-white"
                >
                  {workflow.name}
                </h3>

                {/* Stats */}
                <div className="mt-3 flex items-center gap-4 text-[10px] text-white/30">
                  <span className="flex items-center gap-1">
                    <FiZap className="size-3" />
                    {(workflow.nodes?.length || 1) - 1} steps
                  </span>
                  {workflow.runners && (
                    <span className="flex items-center gap-1">
                      <FiCpu className="size-3" />
                      {workflow.runners.name}
                    </span>
                  )}
                </div>

                {/* Updated */}
                <div className="mt-4 flex items-center gap-1 text-[10px] text-white/20">
                  <FiClock className="size-3" />
                  Updated {new Date(workflow.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
