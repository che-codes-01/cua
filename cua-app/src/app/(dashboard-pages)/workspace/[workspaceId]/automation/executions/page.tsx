"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiCpu,
  FiLoader,
  FiRefreshCw,
  FiSkipForward,
  FiXCircle,
  FiZap,
} from "react-icons/fi";

type StepLog = {
  index: number;
  node_id: string;
  type: string;
  label?: string;
  params?: Record<string, unknown>;
  status: "completed" | "failed" | "skipped";
  result?: unknown;
  error?: string | null;
};

type Execution = {
  id: string;
  workflow_id: string;
  workflow_name: string;
  runner_id: string | null;
  status: "pending" | "running" | "completed" | "failed";
  trigger_source: string;
  error: string | null;
  steps_total: number | null;
  steps_completed: number | null;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
  runners: { id: string; name: string; status: string } | null;
};

type ExecutionDetail = Execution & {
  payload: unknown;
  result: unknown;
  logs: StepLog[];
};

type Workspace = { id: string; name: string; slug: string };

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
] as const;

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

function StatusBadge({ status }: { status: Execution["status"] }) {
  const map = {
    completed: {
      icon: FiCheckCircle,
      cls: "bg-emerald-500/10 text-emerald-400",
      label: "Completed",
    },
    failed: {
      icon: FiXCircle,
      cls: "bg-red-500/10 text-red-400",
      label: "Failed",
    },
    running: {
      icon: FiLoader,
      cls: "bg-blue-500/10 text-blue-400",
      label: "Running",
    },
    pending: {
      icon: FiClock,
      cls: "bg-white/[0.06] text-white/40",
      label: "Pending",
    },
  } as const;
  const { icon: Icon, cls, label } = map[status] ?? map.pending;
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium ${cls}`}
    >
      <Icon className={`size-3 ${status === "running" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

function StepIcon({ status }: { status: StepLog["status"] }) {
  if (status === "completed")
    return <FiCheckCircle className="size-3.5 text-emerald-400" />;
  if (status === "failed")
    return <FiXCircle className="size-3.5 text-red-400" />;
  return <FiSkipForward className="size-3.5 text-white/25" />;
}

function prettyType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ExecutionsMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = params.workspaceId as string;
  const workflowFilter = searchParams.get("workflowId");

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]["value"]>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExecutionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  function refreshNow() {
    setRefreshing(true);
    setReloadKey((k) => k + 1);
  }

  // Workspace name (for breadcrumb)
  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/workspaces");
        if (res.ok) {
          const data = await res.json();
          const ws = data.workspaces?.find(
            (w: Workspace) => w.id === workspaceId
          );
          if (ws) setWorkspace(ws);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [workspaceId]);

  // Load executions on mount, filter changes, manual refresh, and on a timer
  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    const fetchExecutions = async () => {
      try {
        const qs = new URLSearchParams({ workspaceId, status: statusFilter });
        if (workflowFilter) qs.set("workflowId", workflowFilter);
        const res = await fetch(`/api/workflows/executions?${qs.toString()}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setExecutions(data.executions || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchExecutions();

    if (!autoRefresh) return () => { cancelled = true; };
    const interval = setInterval(fetchExecutions, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [workspaceId, statusFilter, workflowFilter, autoRefresh, reloadKey]);

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/workflows/executions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data.execution);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }

  const counts = {
    total: executions.length,
    running: executions.filter((e) => e.status === "running").length,
    failed: executions.filter((e) => e.status === "failed").length,
    completed: executions.filter((e) => e.status === "completed").length,
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-white/[0.06] px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              router.push(`/workspace/${workspaceId}/automation`)
            }
            className="flex items-center gap-2 text-white/40 hover:text-white"
          >
            <FiArrowLeft className="size-4" />
          </button>
          <div className="h-5 w-px bg-white/[0.06]" />
          <div className="flex items-center gap-2">
            <FiActivity className="size-4 text-white/40" />
            <span className="text-sm font-medium text-white/80">
              Monitoring
            </span>
          </div>
          {workspace && (
            <>
              <div className="h-5 w-px bg-white/[0.06]" />
              <span className="text-xs text-white/30">{workspace.name}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] transition ${
              autoRefresh
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-white/[0.07] text-white/30 hover:text-white/60"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                autoRefresh ? "animate-pulse bg-emerald-400" : "bg-white/30"
              }`}
            />
            Live
          </button>
          <button
            onClick={refreshNow}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-white/[0.07] px-3 py-2 text-[10px] text-white/30 transition hover:bg-white/[0.04] hover:text-white/60 disabled:opacity-50"
          >
            <FiRefreshCw
              className={`size-3 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Execution logs
            </h1>
            <p className="mt-2 text-sm text-white/40">
              {workflowFilter
                ? "Runs for the selected workflow"
                : "Monitor runs of your deployed workflows"}
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total runs" value={counts.total} icon={FiZap} />
          <StatCard
            label="Running"
            value={counts.running}
            icon={FiLoader}
            tone="blue"
          />
          <StatCard
            label="Completed"
            value={counts.completed}
            icon={FiCheckCircle}
            tone="emerald"
          />
          <StatCard
            label="Failed"
            value={counts.failed}
            icon={FiXCircle}
            tone="red"
          />
        </div>

        {/* Filters */}
        <div className="mb-4 flex items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs transition ${
                statusFilter === f.value
                  ? "bg-white/[0.08] text-white"
                  : "text-white/40 hover:bg-white/[0.03] hover:text-white/70"
              }`}
            >
              {f.label}
            </button>
          ))}
          {workflowFilter && (
            <button
              onClick={() =>
                router.push(`/workspace/${workspaceId}/automation/executions`)
              }
              className="ml-auto rounded-lg border border-white/[0.07] px-3 py-1.5 text-xs text-white/40 transition hover:text-white/70"
            >
              Clear workflow filter
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            Loading executions...
          </div>
        ) : executions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-16 text-center">
            <FiActivity className="mx-auto size-10 text-white/10" />
            <h3 className="mt-4 text-sm font-medium text-white/50">
              No executions yet
            </h3>
            <p className="mt-2 text-xs text-white/30">
              Trigger a published workflow to see its runs appear here in
              real time.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.01]">
            {executions.map((exec, i) => {
              const expanded = expandedId === exec.id;
              return (
                <div
                  key={exec.id}
                  className={i > 0 ? "border-t border-white/[0.05]" : ""}
                >
                  <button
                    onClick={() => toggleExpand(exec.id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[0.02]"
                  >
                    {expanded ? (
                      <FiChevronDown className="size-4 shrink-0 text-white/40" />
                    ) : (
                      <FiChevronRight className="size-4 shrink-0 text-white/25" />
                    )}

                    <StatusBadge status={exec.status} />

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white/80">
                        {exec.workflow_name}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-white/30">
                        <span className="flex items-center gap-1">
                          <FiClock className="size-3" />
                          {timeAgo(exec.started_at)}
                        </span>
                        {exec.runners && (
                          <span className="flex items-center gap-1">
                            <FiCpu className="size-3" />
                            {exec.runners.name}
                          </span>
                        )}
                        <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-white/40">
                          {exec.trigger_source}
                        </span>
                      </div>
                    </div>

                    <div className="hidden shrink-0 text-right sm:block">
                      <div className="text-xs text-white/50">
                        {exec.steps_completed ?? 0}/{exec.steps_total ?? 0} steps
                      </div>
                      <div className="mt-1 text-[10px] text-white/25">
                        {formatDuration(exec.duration_ms)}
                      </div>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-white/[0.05] bg-[#0b0b0b] px-5 py-4">
                      {detailLoading || !detail ? (
                        <div className="py-6 text-center text-xs text-white/30">
                          Loading logs...
                        </div>
                      ) : (
                        <ExecutionDetailView detail={detail} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "emerald" | "red" | "blue";
}) {
  const toneCls = {
    default: "text-white/40",
    emerald: "text-emerald-400",
    red: "text-red-400",
    blue: "text-blue-400",
  }[tone];
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-white/30">
          {label}
        </span>
        <Icon className={`size-3.5 ${toneCls}`} />
      </div>
      <div className={`mt-2 text-2xl font-semibold ${toneCls}`}>{value}</div>
    </div>
  );
}

function ExecutionDetailView({ detail }: { detail: ExecutionDetail }) {
  const logs = Array.isArray(detail.logs) ? detail.logs : [];

  return (
    <div className="space-y-4">
      {/* Meta row */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-white/40">
        <span>
          Started{" "}
          <span className="text-white/60">
            {new Date(detail.started_at).toLocaleString()}
          </span>
        </span>
        {detail.completed_at && (
          <span>
            Finished{" "}
            <span className="text-white/60">
              {new Date(detail.completed_at).toLocaleString()}
            </span>
          </span>
        )}
        <span>
          Duration{" "}
          <span className="text-white/60">
            {formatDuration(detail.duration_ms)}
          </span>
        </span>
        <span className="font-mono text-white/25">{detail.id}</span>
      </div>

      {/* Top-level error */}
      {detail.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-300">
          <FiAlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span className="break-words">{detail.error}</span>
        </div>
      )}

      {/* Steps */}
      {logs.length === 0 ? (
        <p className="text-xs text-white/30">No step logs recorded.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((step) => (
            <StepRow key={step.node_id + step.index} step={step} />
          ))}
        </div>
      )}

      {/* Trigger payload */}
      {detail.payload != null &&
        Object.keys(detail.payload as object).length > 0 && (
          <details className="rounded-lg border border-white/[0.06] bg-white/[0.01]">
            <summary className="cursor-pointer px-3 py-2 text-[11px] text-white/40 hover:text-white/60">
              Trigger payload
            </summary>
            <pre className="overflow-x-auto px-3 pb-3 text-[11px] leading-relaxed text-white/50">
              {JSON.stringify(detail.payload, null, 2)}
            </pre>
          </details>
        )}
    </div>
  );
}

function StepRow({ step }: { step: StepLog }) {
  const [open, setOpen] = useState(false);
  const hasDetail =
    step.error != null ||
    (step.result != null &&
      !(typeof step.result === "object" &&
        Object.keys(step.result as object).length === 0)) ||
    (step.params && Object.keys(step.params).length > 0);

  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.01]">
      <button
        onClick={() => hasDetail && setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${
          hasDetail ? "hover:bg-white/[0.02]" : "cursor-default"
        }`}
      >
        <span className="w-5 shrink-0 text-center font-mono text-[10px] text-white/25">
          {step.index + 1}
        </span>
        <StepIcon status={step.status} />
        <span className="flex-1 text-xs text-white/70">
          {step.label ?? prettyType(step.type)}
        </span>
        <span
          className={`text-[10px] ${
            step.status === "failed"
              ? "text-red-400"
              : step.status === "skipped"
                ? "text-white/25"
                : "text-emerald-400/70"
          }`}
        >
          {step.status}
        </span>
        {hasDetail &&
          (open ? (
            <FiChevronDown className="size-3.5 text-white/30" />
          ) : (
            <FiChevronRight className="size-3.5 text-white/20" />
          ))}
      </button>

      {open && hasDetail && (
        <div className="space-y-2 border-t border-white/[0.05] px-3 py-2.5">
          {step.params && Object.keys(step.params).length > 0 && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-white/25">
                Parameters
              </p>
              <pre className="overflow-x-auto text-[11px] leading-relaxed text-white/50">
                {JSON.stringify(step.params, null, 2)}
              </pre>
            </div>
          )}
          {step.error && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-red-400/60">
                Error
              </p>
              <p className="break-words text-[11px] text-red-300">
                {step.error}
              </p>
            </div>
          )}
          {step.result != null && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-white/25">
                Result
              </p>
              <pre className="overflow-x-auto text-[11px] leading-relaxed text-white/50">
                {typeof step.result === "string"
                  ? step.result
                  : JSON.stringify(step.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
