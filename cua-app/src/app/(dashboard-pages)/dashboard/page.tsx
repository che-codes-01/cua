"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiActivity,
  FiArrowUpRight,
  FiBox,
  FiCheck,
  FiChevronDown,
  FiCopy,
  FiCpu,
  FiKey,
  FiMonitor,
  FiMoreHorizontal,
  FiPlus,
  FiRefreshCw,
  FiSettings,
  FiTerminal,
  FiTrash2,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";

import { Button } from "@/components/ui/button";
import Logo from "@/components/custom/Logo";
import SignOutButton from "@/app/(auth-pages)/signout/page";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
};

type Runner = {
  id: string;
  name: string;
  status: "online" | "offline" | "busy";
  labels: string[] | null;
  last_seen_at: string;
};

type RunnerKey = {
  id: string;
  key_prefix: string;
  name: string;
  created_at: string;
};

type NavSection =
  | "overview"
  | "runners"
  | "api-keys"
  | "activity"
  | "members"
  | "settings";

export default function DashboardPage() {
  const router = useRouter();

  // Data state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [runnerKeys, setRunnerKeys] = useState<RunnerKey[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null,
  );

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedWorkspaceId, setCopiedWorkspaceId] = useState(false);
  const [activeNav, setActiveNav] = useState<NavSection>("overview");
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);
  const [showAddRunnerModal, setShowAddRunnerModal] = useState(false);
  const [showRunnerMenu, setShowRunnerMenu] = useState<string | null>(null);
  const [rotatingKeyId, setRotatingKeyId] = useState<string | null>(null);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [showRotatedKeyModal, setShowRotatedKeyModal] = useState<{ keyName: string; newKey: string } | null>(null);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, []);

  // Load workspace data when workspace changes
  useEffect(() => {
    if (selectedWorkspace) {
      loadWorkspaceData();
    }
  }, [selectedWorkspace?.id]);

  // Auto-refresh runners every 10 seconds
  useEffect(() => {
    if (!selectedWorkspace) return;

    const interval = setInterval(() => {
      loadWorkspaceData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedWorkspace?.id]);

  async function loadWorkspaces() {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/workspaces");

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/signin");
        }
        return;
      }

      const data = await res.json();
      setWorkspaces(data.workspaces || []);

      if (data.workspaces?.length > 0) {
        setSelectedWorkspace(data.workspaces[0]);
      }
    } catch (error) {
      console.error("Error loading workspaces:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkspaceData(silent = false) {
    if (!selectedWorkspace) return;

    if (!silent) setRefreshing(true);

    try {
      const [runnersRes, keysRes] = await Promise.all([
        fetch(`/api/onboarding/runners?workspaceId=${selectedWorkspace.id}`),
        fetch(`/api/dashboard/runner-keys?workspaceId=${selectedWorkspace.id}`),
      ]);

      if (runnersRes.ok) {
        const data = await runnersRes.json();
        setRunners(data.runners || []);
      }

      if (keysRes.ok) {
        const data = await keysRes.json();
        setRunnerKeys(data.keys || []);
      }
    } catch (error) {
      console.error("Error loading workspace data:", error);
    } finally {
      setRefreshing(false);
    }
  }

  async function copyToClipboard(text: string, keyId?: string) {
    await navigator.clipboard.writeText(text);
    if (keyId) {
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } else {
      setCopiedWorkspaceId(true);
      setTimeout(() => setCopiedWorkspaceId(false), 2000);
    }
  }

  async function handleRevokeKey(keyId: string) {
    if (!selectedWorkspace) return;

    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone and any runners using this key will stop working.")) {
      return;
    }

    setRevokingKeyId(keyId);

    try {
      const res = await fetch("/api/dashboard/runner-keys/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyId,
          workspaceId: selectedWorkspace.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to revoke key");
        return;
      }

      // Remove the key from the local state
      setRunnerKeys((keys) => keys.filter((k) => k.id !== keyId));
    } catch (error) {
      console.error("Error revoking key:", error);
      alert("Failed to revoke key");
    } finally {
      setRevokingKeyId(null);
    }
  }

  async function handleRotateKey(keyId: string) {
    if (!selectedWorkspace) return;

    if (!confirm("Are you sure you want to rotate this API key? The current key will stop working immediately and you'll need to update your runners with the new key.")) {
      return;
    }

    setRotatingKeyId(keyId);

    try {
      const res = await fetch("/api/dashboard/runner-keys/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyId,
          workspaceId: selectedWorkspace.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to rotate key");
        return;
      }

      // Update the key in local state
      setRunnerKeys((keys) =>
        keys.map((k) =>
          k.id === keyId
            ? { ...k, key_prefix: data.key.key_prefix }
            : k
        )
      );

      // Show the new key in a modal (only shown once)
      setShowRotatedKeyModal({
        keyName: data.key.name,
        newKey: data.key.newKey,
      });
    } catch (error) {
      console.error("Error rotating key:", error);
      alert("Failed to rotate key");
    } finally {
      setRotatingKeyId(null);
    }
  }

  async function handleCreateKey(name: string) {
    if (!selectedWorkspace) return;

    setCreatingKey(true);

    try {
      const res = await fetch("/api/dashboard/runner-keys/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: selectedWorkspace.id,
          name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to create key");
        return;
      }

      // Add the new key to local state
      setRunnerKeys((keys) => [
        {
          id: data.key.id,
          name: data.key.name,
          key_prefix: data.key.key_prefix,
          created_at: data.key.created_at,
        },
        ...keys,
      ]);

      // Close create modal and show the new key
      setShowCreateKeyModal(false);
      setShowRotatedKeyModal({
        keyName: data.key.name,
        newKey: data.key.newKey,
      });
    } catch (error) {
      console.error("Error creating key:", error);
      alert("Failed to create key");
    } finally {
      setCreatingKey(false);
    }
  }

  function switchWorkspace(workspace: Workspace) {
    setSelectedWorkspace(workspace);
    setShowWorkspaceSwitcher(false);
    setRunners([]);
    setRunnerKeys([]);
  }

  const stats = {
    totalRunners: runners.length,
    onlineRunners: runners.filter((r) => r.status === "online").length,
    busyRunners: runners.filter((r) => r.status === "busy").length,
    apiKeys: runnerKeys.length,
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/30">
          <FiRefreshCw className="size-4 animate-spin" />
          Loading dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[240px] shrink-0 border-r border-white/[0.06] lg:flex lg:flex-col">
          <div className="flex h-20 items-center border-b border-white/[0.06] px-6">
            <Logo />
          </div>

          <div className="flex flex-1 flex-col px-3 py-6">
            {/* Workspace Switcher */}
            <div className="mb-8 px-2 relative">
              <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/20">
                Workspace
              </p>

              <button
                onClick={() => setShowWorkspaceSwitcher(!showWorkspaceSwitcher)}
                className="flex w-full items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-left transition hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs text-white/70">
                    {selectedWorkspace?.name || "Select workspace"}
                  </p>
                  <p className="mt-1 font-mono text-[9px] text-white/20">
                    {selectedWorkspace?.slug || ""}
                  </p>
                </div>
                <FiChevronDown
                  className={`size-3.5 text-white/30 transition ${showWorkspaceSwitcher ? "rotate-180" : ""}`}
                />
              </button>

              {/* Workspace Dropdown */}
              {showWorkspaceSwitcher && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-lg border border-white/[0.07] bg-[#0d0d0d] shadow-xl">
                  <div className="max-h-[200px] overflow-y-auto">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => switchWorkspace(ws)}
                        className={`flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-white/[0.04] first:rounded-t-lg ${
                          ws.id === selectedWorkspace?.id ? "bg-white/[0.04]" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs text-white/70">
                            {ws.name}
                          </p>
                          <p className="mt-1 font-mono text-[9px] text-white/20">
                            {ws.slug}
                          </p>
                        </div>
                        {ws.id === selectedWorkspace?.id && (
                          <FiCheck className="size-3.5 text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/[0.06]">
                    <button
                      onClick={() => router.push("/onboarding")}
                      className="flex w-full items-center gap-2 rounded-b-lg px-3 py-2.5 text-[10px] text-white/30 transition hover:bg-white/[0.04] hover:text-white/60"
                    >
                      <FiPlus className="size-3" />
                      Create new workspace
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              <NavItem
                icon={FiBox}
                label="Overview"
                active={activeNav === "overview"}
                onClick={() => setActiveNav("overview")}
              />
              <NavItem
                icon={FiMonitor}
                label="Runners"
                active={activeNav === "runners"}
                onClick={() => setActiveNav("runners")}
                badge={
                  stats.onlineRunners > 0
                    ? stats.onlineRunners.toString()
                    : undefined
                }
              />
              <NavItem
                icon={FiKey}
                label="API Keys"
                active={activeNav === "api-keys"}
                onClick={() => setActiveNav("api-keys")}
              />
              <NavItem
                icon={FiActivity}
                label="Activity"
                active={activeNav === "activity"}
                onClick={() => setActiveNav("activity")}
              />
            </nav>

            <div className="mt-8">
              <p className="mb-3 px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/20">
                Workspace
              </p>
              <nav className="space-y-1">
                <NavItem
                  icon={FiUsers}
                  label="Members"
                  active={activeNav === "members"}
                  onClick={() => setActiveNav("members")}
                />
                <NavItem
                  icon={FiSettings}
                  label="Settings"
                  active={activeNav === "settings"}
                  onClick={() => setActiveNav("settings")}
                />
              </nav>
            </div>

            {/* Refresh button */}
            <div className="mt-auto pt-6 gap-2 flex flex-col">
              <SignOutButton className="w-full" />
              <button
                onClick={() => loadWorkspaceData()}
                disabled={refreshing}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.07] py-2.5 text-[10px] text-white/30 transition hover:bg-white/[0.04] hover:text-white/60 disabled:opacity-50"
              >
                <FiRefreshCw
                  className={`size-3 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh data"}
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="flex h-20 items-center justify-between border-b border-white/[0.06] px-6 lg:px-10">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
                {activeNav === "overview"
                  ? "Workspace overview"
                  : activeNav.replace("-", " ")}
              </p>
              <h1 className="mt-1 text-sm font-medium text-white/80">
                {selectedWorkspace?.name || "Dashboard"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.open("/docs", "_blank")}
                className="hidden h-9 border-white/[0.08] bg-white/[0.02] px-3 text-[10px] text-white/40 hover:bg-white/[0.05] hover:text-white sm:flex"
              >
                <FiTerminal className="mr-2 size-3" />
                Documentation
                <FiArrowUpRight className="ml-2 size-3" />
              </Button>

              <Button
                variant="outline"
                onClick={() => selectedWorkspace && router.push(`/workspace/${selectedWorkspace.id}/automation`)}
                disabled={!selectedWorkspace}
                className="h-9 border-white/[0.08] bg-white/[0.02] px-3 text-[10px] text-white/40 hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
              >
                <FiZap className="mr-2 size-3" />
                Workflows
              </Button>

              <Button
                onClick={() => setShowAddRunnerModal(true)}
                className="h-9 bg-white px-4 text-[10px] text-black hover:bg-white/90"
              >
                <FiPlus className="mr-2 size-3.5" />
                Add runner
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="mx-auto w-full max-w-[1400px] px-6 py-10 lg:px-10">
            {activeNav === "overview" && (
              <OverviewSection
                selectedWorkspace={selectedWorkspace}
                runners={runners}
                runnerKeys={runnerKeys}
                stats={stats}
                copiedKeyId={copiedKeyId}
                copiedWorkspaceId={copiedWorkspaceId}
                showRunnerMenu={showRunnerMenu}
                setShowRunnerMenu={setShowRunnerMenu}
                copyToClipboard={copyToClipboard}
                onAddRunner={() => setShowAddRunnerModal(true)}
                onViewAllRunners={() => setActiveNav("runners")}
                onViewActivity={() => setActiveNav("activity")}
              />
            )}

            {activeNav === "runners" && (
              <RunnersSection
                runners={runners}
                showRunnerMenu={showRunnerMenu}
                setShowRunnerMenu={setShowRunnerMenu}
                onAddRunner={() => setShowAddRunnerModal(true)}
              />
            )}

            {activeNav === "api-keys" && (
              <ApiKeysSection
                runnerKeys={runnerKeys}
                copiedKeyId={copiedKeyId}
                copyToClipboard={copyToClipboard}
                selectedWorkspace={selectedWorkspace}
                onRevokeKey={handleRevokeKey}
                onRotateKey={handleRotateKey}
                rotatingKeyId={rotatingKeyId}
                revokingKeyId={revokingKeyId}
                onCreateKey={() => setShowCreateKeyModal(true)}
              />
            )}

            {activeNav === "activity" && <ActivitySection />}

            {activeNav === "members" && <MembersSection />}

            {activeNav === "settings" && (
              <SettingsSection workspace={selectedWorkspace} />
            )}
          </div>
        </div>
      </div>

      {/* Add Runner Modal */}
      {showAddRunnerModal && selectedWorkspace && (
        <AddRunnerModal
          workspace={selectedWorkspace}
          runnerKeys={runnerKeys}
          onClose={() => setShowAddRunnerModal(false)}
        />
      )}

      {/* Rotated Key Modal */}
      {showRotatedKeyModal && (
        <RotatedKeyModal
          keyName={showRotatedKeyModal.keyName}
          newKey={showRotatedKeyModal.newKey}
          onClose={() => setShowRotatedKeyModal(null)}
        />
      )}

      {/* Create Key Modal */}
      {showCreateKeyModal && (
        <CreateKeyModal
          onClose={() => setShowCreateKeyModal(false)}
          onCreateKey={handleCreateKey}
          isCreating={creatingKey}
        />
      )}

      {/* Click outside handlers */}
      {(showWorkspaceSwitcher || showRunnerMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowWorkspaceSwitcher(false);
            setShowRunnerMenu(null);
          }}
        />
      )}
    </main>
  );
}

// ============ Sections ============

function OverviewSection({
  selectedWorkspace,
  runners,
  runnerKeys,
  stats,
  copiedKeyId,
  copiedWorkspaceId,
  showRunnerMenu,
  setShowRunnerMenu,
  copyToClipboard,
  onAddRunner,
  onViewAllRunners,
  onViewActivity,
}: {
  selectedWorkspace: Workspace | null;
  runners: Runner[];
  runnerKeys: RunnerKey[];
  stats: {
    totalRunners: number;
    onlineRunners: number;
    busyRunners: number;
    apiKeys: number;
  };
  copiedKeyId: string | null;
  copiedWorkspaceId: boolean;
  showRunnerMenu: string | null;
  setShowRunnerMenu: (id: string | null) => void;
  copyToClipboard: (text: string, keyId?: string) => void;
  onAddRunner: () => void;
  onViewAllRunners: () => void;
  onViewActivity: () => void;
}) {
  return (
    <>
      {/* Hero */}
      <section className="mb-10">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`size-1.5 rounded-full ${stats.onlineRunners > 0 ? "bg-emerald-400" : "bg-yellow-400"}`}
              />
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">
                {stats.onlineRunners > 0 ? "Operational" : "No runners online"}
              </span>
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Your automation infrastructure.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/30">
              Manage runners, credentials, and execution infrastructure for your
              workspace.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-white/25">
            <span>Workspace ID</span>
            <code className="rounded bg-white/[0.04] px-2 py-1 font-mono text-white/35">
              {selectedWorkspace?.id?.slice(0, 8) || "—"}...
            </code>
            <button
              onClick={() =>
                selectedWorkspace && copyToClipboard(selectedWorkspace.id)
              }
              className="hover:text-white transition"
            >
              {copiedWorkspaceId ? (
                <FiCheck className="size-3 text-emerald-400" />
              ) : (
                <FiCopy className="size-3" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total runners"
          value={stats.totalRunners.toString()}
          icon={FiMonitor}
        />
        <StatCard
          label="Online now"
          value={stats.onlineRunners.toString()}
          icon={FiActivity}
          accent={stats.onlineRunners > 0}
        />
        <StatCard
          label="Busy"
          value={stats.busyRunners.toString()}
          icon={FiZap}
        />
        <StatCard
          label="API keys"
          value={stats.apiKeys.toString()}
          icon={FiKey}
        />
      </section>

      {/* Main Grid */}
      <div className="mt-8 grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        {/* Runners */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FiMonitor className="size-3.5 text-white/30" />
                <h3 className="text-xs font-medium text-white/60">Runners</h3>
              </div>
              <p className="mt-1 text-[10px] text-white/20">
                Machines connected to this workspace
              </p>
            </div>
            <button
              onClick={onViewAllRunners}
              className="text-[10px] text-white/30 transition hover:text-white"
            >
              View all →
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0b0b]">
            {runners.length > 0 ? (
              <div className="divide-y divide-white/[0.06]">
                {runners.slice(0, 3).map((runner) => (
                  <RunnerRow
                    key={runner.id}
                    runner={runner}
                    showMenu={showRunnerMenu === runner.id}
                    onToggleMenu={() =>
                      setShowRunnerMenu(
                        showRunnerMenu === runner.id ? null : runner.id,
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-[10px] text-white/20">
                No runners connected yet
              </div>
            )}

            <button
              onClick={onAddRunner}
              className="flex w-full items-center justify-center gap-2 border-t border-white/[0.06] py-3 text-[10px] text-white/25 transition hover:bg-white/[0.025] hover:text-white/50"
            >
              <FiPlus className="size-3" />
              Connect another runner
            </button>
          </div>
        </section>

        {/* API Keys */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <FiKey className="size-3.5 text-white/30" />
            <div>
              <h3 className="text-xs font-medium text-white/60">
                Runner connection
              </h3>
              <p className="mt-1 text-[10px] text-white/20">
                Authentication credentials
              </p>
            </div>
          </div>

          {runnerKeys.length > 0 ? (
            <div className="rounded-xl border border-white/[0.07] bg-[#0b0b0b]">
              {runnerKeys.slice(0, 2).map((key) => (
                <RunnerKeyCard
                  key={key.id}
                  runnerKey={key}
                  copied={copiedKeyId === key.id}
                  onCopy={() => copyToClipboard(key.key_prefix, key.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.07] bg-[#0b0b0b] p-5 text-center text-[10px] text-white/20">
              No runner keys created yet
            </div>
          )}
        </section>
      </div>

      {/* Bottom Grid */}
      <div className="mt-8 grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        {/* Activity */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FiActivity className="size-3.5 text-white/30" />
                <h3 className="text-xs font-medium text-white/60">
                  Recent activity
                </h3>
              </div>
              <p className="mt-1 text-[10px] text-white/20">
                Latest workspace events
              </p>
            </div>
            <button
              onClick={onViewActivity}
              className="text-[10px] text-white/30 hover:text-white"
            >
              View activity →
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0b0b] p-5 text-center text-[10px] text-white/20">
            Activity tracking coming soon
          </div>
        </section>

        {/* Workspace Info */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <FiBox className="size-3.5 text-white/30" />
            <div>
              <h3 className="text-xs font-medium text-white/60">Workspace</h3>
              <p className="mt-1 text-[10px] text-white/20">
                Configuration details
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-[#0b0b0b]">
            <InfoRow
              label="Workspace ID"
              value={selectedWorkspace?.id || "—"}
              truncate
            />
            <InfoRow label="Slug" value={selectedWorkspace?.slug || "—"} />
            <InfoRow
              label="Created"
              value={
                selectedWorkspace
                  ? new Date(selectedWorkspace.created_at).toLocaleDateString()
                  : "—"
              }
            />
          </div>
        </section>
      </div>
    </>
  );
}

function RunnersSection({
  runners,
  showRunnerMenu,
  setShowRunnerMenu,
  onAddRunner,
}: {
  runners: Runner[];
  showRunnerMenu: string | null;
  setShowRunnerMenu: (id: string | null) => void;
  onAddRunner: () => void;
}) {
  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            Runners
          </h2>
          <p className="mt-2 text-sm text-white/30">
            All runners connected to this workspace
          </p>
        </div>
        <Button
          onClick={onAddRunner}
          className="h-9 bg-white px-4 text-[10px] text-black hover:bg-white/90"
        >
          <FiPlus className="mr-2 size-3.5" />
          Add runner
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0b0b]">
        {runners.length > 0 ? (
          <div className="divide-y divide-white/[0.06]">
            {runners.map((runner) => (
              <RunnerRow
                key={runner.id}
                runner={runner}
                showMenu={showRunnerMenu === runner.id}
                onToggleMenu={() =>
                  setShowRunnerMenu(
                    showRunnerMenu === runner.id ? null : runner.id,
                  )
                }
                expanded
              />
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <FiMonitor className="mx-auto size-8 text-white/10" />
            <p className="mt-4 text-sm text-white/30">
              No runners connected yet
            </p>
            <Button
              onClick={onAddRunner}
              className="mt-4 h-9 bg-white px-4 text-[10px] text-black hover:bg-white/90"
            >
              <FiPlus className="mr-2 size-3.5" />
              Connect your first runner
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function ApiKeysSection({
  runnerKeys,
  copiedKeyId,
  copyToClipboard,
  selectedWorkspace,
  onRevokeKey,
  onRotateKey,
  rotatingKeyId,
  revokingKeyId,
  onCreateKey,
}: {
  runnerKeys: RunnerKey[];
  copiedKeyId: string | null;
  copyToClipboard: (text: string, keyId?: string) => void;
  selectedWorkspace: Workspace | null;
  onRevokeKey: (keyId: string) => void;
  onRotateKey: (keyId: string) => void;
  rotatingKeyId: string | null;
  revokingKeyId: string | null;
  onCreateKey: () => void;
}) {
  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            API Keys
          </h2>
          <p className="mt-2 text-sm text-white/30">
            Authentication credentials for runners
          </p>
        </div>
        <Button
          onClick={onCreateKey}
          className="h-9 bg-white px-4 text-[10px] text-black hover:bg-white/90"
        >
          <FiPlus className="mr-2 size-3.5" />
          Create key
        </Button>
      </div>

      {runnerKeys.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {runnerKeys.map((key) => (
            <RunnerKeyCard
              key={key.id}
              runnerKey={key}
              copied={copiedKeyId === key.id}
              onCopy={() => copyToClipboard(key.key_prefix, key.id)}
              expanded
              onRevoke={() => onRevokeKey(key.id)}
              onRotate={() => onRotateKey(key.id)}
              isRotating={rotatingKeyId === key.id}
              isRevoking={revokingKeyId === key.id}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-12 text-center">
          <FiKey className="mx-auto size-8 text-white/10" />
          <p className="mt-4 text-sm text-white/30">No API keys created yet</p>
        </div>
      )}
    </>
  );
}

function ActivitySection() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
          Activity
        </h2>
        <p className="mt-2 text-sm text-white/30">
          Recent workspace events and logs
        </p>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-12 text-center">
        <FiActivity className="mx-auto size-8 text-white/10" />
        <p className="mt-4 text-sm text-white/30">
          Activity tracking coming soon
        </p>
        <p className="mt-2 text-xs text-white/20">
          View command executions, runner connections, and more
        </p>
      </div>
    </>
  );
}

function MembersSection() {
  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            Members
          </h2>
          <p className="mt-2 text-sm text-white/30">Manage workspace access</p>
        </div>
        <Button className="h-9 bg-white px-4 text-[10px] text-black hover:bg-white/90">
          <FiPlus className="mr-2 size-3.5" />
          Invite member
        </Button>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-12 text-center">
        <FiUsers className="mx-auto size-8 text-white/10" />
        <p className="mt-4 text-sm text-white/30">
          Team management coming soon
        </p>
      </div>
    </>
  );
}

function SettingsSection({ workspace }: { workspace: Workspace | null }) {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
          Settings
        </h2>
        <p className="mt-2 text-sm text-white/30">
          Configure workspace settings
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-white/[0.07] bg-[#0b0b0b] p-6">
          <h3 className="text-sm font-medium text-white/70">General</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-[10px] text-white/30">
                Workspace Name
              </label>
              <input
                type="text"
                defaultValue={workspace?.name || ""}
                className="mt-1 w-full rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-sm text-white/70 outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/30">Slug</label>
              <input
                type="text"
                defaultValue={workspace?.slug || ""}
                disabled
                className="mt-1 w-full rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-sm text-white/30 outline-none"
              />
            </div>
          </div>
          <div className="mt-6">
            <Button className="h-9 bg-white px-4 text-[10px] text-black hover:bg-white/90">
              Save changes
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-red-400/10 bg-[#0b0b0b] p-6">
          <h3 className="text-sm font-medium text-red-400/70">Danger Zone</h3>
          <p className="mt-2 text-[10px] text-white/30">Irreversible actions</p>
          <div className="mt-4">
            <Button
              variant="outline"
              className="h-9 border-red-400/20 px-4 text-[10px] text-red-400/70 hover:bg-red-400/10"
            >
              <FiTrash2 className="mr-2 size-3" />
              Delete workspace
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============ Components ============

function NavItem({
  icon: Icon,
  label,
  active = false,
  onClick,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[10px] transition ${
        active
          ? "bg-white/[0.06] text-white"
          : "text-white/30 hover:bg-white/[0.035] hover:text-white/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="size-3.5" />
        {label}
      </div>
      {badge && (
        <span className="rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[8px] text-emerald-400">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#0b0b0b] p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/20">
          {label}
        </span>
        <Icon className="size-3.5 text-white/20" />
      </div>
      <div className="mt-6 flex items-end gap-3">
        <span className="text-2xl font-medium tracking-[-0.04em] text-white/80">
          {value}
        </span>
        {accent && (
          <span className="mb-1 flex items-center gap-1 text-[9px] text-emerald-400/60">
            <span className="size-1 rounded-full bg-emerald-400" />
            live
          </span>
        )}
      </div>
    </div>
  );
}

function RunnerRow({
  runner,
  showMenu,
  onToggleMenu,
  expanded = false,
}: {
  runner: Runner;
  showMenu: boolean;
  onToggleMenu: () => void;
  expanded?: boolean;
}) {
  return (
    <div className="group relative flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.015]">
      <div className="relative flex size-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]">
        <FiCpu className="size-3.5 text-white/30" />
        <span
          className={`absolute -right-0.5 -top-0.5 size-2 rounded-full border-2 border-[#0b0b0b] ${
            runner.status === "online"
              ? "bg-emerald-400"
              : runner.status === "busy"
                ? "bg-yellow-400"
                : "bg-white/20"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[11px] text-white/55">{runner.name}</p>
          {runner.labels && runner.labels.length > 0 && (
            <span className="font-mono text-[8px] uppercase text-white/15">
              {runner.labels[0]}
            </span>
          )}
        </div>
        <p className="mt-1 text-[9px] text-white/20">
          {runner.last_seen_at
            ? new Date(runner.last_seen_at).toLocaleString()
            : "Never"}
        </p>
        {expanded && (
          <p className="mt-1 font-mono text-[8px] text-white/15">{runner.id}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span
          className={`font-mono text-[8px] uppercase tracking-wider ${
            runner.status === "online"
              ? "text-emerald-400/60"
              : runner.status === "busy"
                ? "text-yellow-400/60"
                : "text-white/20"
          }`}
        >
          {runner.status}
        </span>

        <button
          onClick={onToggleMenu}
          className="relative opacity-0 transition group-hover:opacity-100"
        >
          <FiMoreHorizontal className="size-4 text-white/25 hover:text-white" />
        </button>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute right-5 top-full z-50 mt-1 w-40 rounded-lg border border-white/[0.07] bg-[#0d0d0d] py-1 shadow-xl">
          <button className="flex w-full items-center gap-2 px-3 py-2 text-[10px] text-white/50 hover:bg-white/[0.04] hover:text-white">
            <FiSettings className="size-3" />
            Configure
          </button>
          <button className="flex w-full items-center gap-2 px-3 py-2 text-[10px] text-white/50 hover:bg-white/[0.04] hover:text-white">
            <FiActivity className="size-3" />
            View logs
          </button>
          <div className="my-1 border-t border-white/[0.06]" />
          <button className="flex w-full items-center gap-2 px-3 py-2 text-[10px] text-red-400/60 hover:bg-red-400/[0.04] hover:text-red-400">
            <FiTrash2 className="size-3" />
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function RunnerKeyCard({
  runnerKey,
  copied,
  onCopy,
  expanded = false,
  onRevoke,
  onRotate,
  isRotating = false,
  isRevoking = false,
}: {
  runnerKey: RunnerKey;
  copied: boolean;
  onCopy: () => void;
  expanded?: boolean;
  onRevoke?: () => void;
  onRotate?: () => void;
  isRotating?: boolean;
  isRevoking?: boolean;
}) {
  return (
    <div className="border-b border-white/[0.06] p-5 last:border-0">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-white/55">{runnerKey.name}</p>
          <p className="mt-1 text-[9px] text-white/20">
            {new Date(runnerKey.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/10 bg-emerald-400/[0.04] px-2 py-1 font-mono text-[8px] uppercase tracking-wider text-emerald-400/70">
          Active
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-black/30 p-2">
        <code className="min-w-0 flex-1 overflow-hidden truncate px-2 font-mono text-[10px] text-white/35">
          {runnerKey.key_prefix}••••••••••••••••
        </code>
        <button
          onClick={onCopy}
          className="flex shrink-0 items-center gap-2 rounded-md bg-white/[0.06] px-3 py-2 text-[10px] text-white/40 transition hover:bg-white/[0.09] hover:text-white"
        >
          {copied ? "Copied" : "Copy prefix"}
          {copied ? (
            <FiCheck className="size-3 text-emerald-400" />
          ) : (
            <FiCopy className="size-3" />
          )}
        </button>
      </div>

      {expanded && (
        <>
          <p className="mt-3 text-[10px] leading-5 text-white/20">
            Used by runners to authenticate with this workspace.
          </p>
          <div className="mt-5 flex gap-2">
            <button
              onClick={onRotate}
              disabled={isRotating || isRevoking}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.07] py-2.5 text-[10px] text-white/35 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={`size-3 ${isRotating ? "animate-spin" : ""}`} />
              {isRotating ? "Rotating..." : "Rotate key"}
            </button>
            <button
              onClick={onRevoke}
              disabled={isRotating || isRevoking}
              className="flex items-center justify-center rounded-lg border border-red-400/[0.08] px-3 text-red-400/40 transition hover:bg-red-400/[0.04] hover:text-red-400/70 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRevoking ? (
                <FiRefreshCw className="size-3 animate-spin" />
              ) : (
                <FiTrash2 className="size-3" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  truncate = false,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 last:border-0">
      <span className="text-[10px] text-white/25">{label}</span>
      <code
        className={`font-mono text-[9px] text-white/35 ${truncate ? "max-w-[150px] truncate" : ""}`}
      >
        {value}
      </code>
    </div>
  );
}

function AddRunnerModal({
  workspace,
  runnerKeys,
  onClose,
}: {
  workspace: Workspace;
  runnerKeys: RunnerKey[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const apiKeyPrefix = runnerKeys[0]?.key_prefix || "YOUR_API_KEY";
  const apiKey = `${apiKeyPrefix}***********`;

  const command = `npx cua-runner --service-url ${process.env.NEXT_PUBLIC_SERVICE_URL || "wss://cua-service.vercel.app"} --api-key ${apiKey}`;

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 rounded-xl border border-white/[0.07] bg-[#0a0a0a] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/30 hover:text-white"
        >
          <FiX className="size-5" />
        </button>

        <div className="flex size-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025]">
          <FiTerminal className="size-5 text-white/50" />
        </div>

        <h2 className="mt-6 text-xl font-semibold tracking-[-0.03em] text-white">
          Connect a runner
        </h2>

        <p className="mt-2 text-sm text-white/30">
          Run this command on the machine you want to connect:
        </p>

        <div className="mt-6 rounded-lg border border-white/[0.07] bg-black/40 p-4">
          <code className="block whitespace-pre-wrap break-all font-mono text-[11px] text-white/60">
            {command}
          </code>
        </div>

        <p className="mt-3 text-[10px] text-white/40">
          Note: The API key shown is a prefix. Get your full API key from the{" "}
          <span className="font-semibold text-white/50">Runner Keys</span> section.
        </p>

        <div className="mt-4 flex gap-3">
          <Button
            onClick={copyCommand}
            className="flex-1 h-10 bg-white text-xs text-black hover:bg-white/90"
          >
            {copied ? (
              <FiCheck className="mr-2 size-3.5" />
            ) : (
              <FiCopy className="mr-2 size-3.5" />
            )}
            {copied ? "Copied!" : "Copy command"}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="h-10 border-white/[0.08] px-4 text-xs text-white/50 hover:bg-white/[0.05] hover:text-white"
          >
            Close
          </Button>
        </div>

        <p className="mt-4 text-[10px] text-white/20">
          Make sure you have Node.js installed. The runner will automatically
          connect to your workspace.
        </p>
      </div>
    </div>
  );
}

function RotatedKeyModal({
  keyName,
  newKey,
  onClose,
}: {
  keyName: string;
  newKey: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 rounded-xl border border-white/[0.07] bg-[#0a0a0a] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/30 hover:text-white"
        >
          <FiX className="size-5" />
        </button>

        <div className="flex size-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08]">
          <FiCheck className="size-5 text-emerald-400" />
        </div>

        <h2 className="mt-6 text-xl font-semibold tracking-[-0.03em] text-white">
          Key rotated successfully
        </h2>

        <p className="mt-2 text-sm text-white/30">
          Your API key <span className="text-white/50">&quot;{keyName}&quot;</span> has been rotated.
          Copy and save the new key below — it won&apos;t be shown again.
        </p>

        <div className="mt-6 rounded-lg border border-yellow-400/20 bg-yellow-400/[0.04] p-3">
          <div className="flex items-center gap-2 text-[10px] text-yellow-400/80">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            This key will only be displayed once. Store it securely.
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-white/[0.07] bg-black/40 p-4">
          <code className="block whitespace-pre-wrap break-all font-mono text-[11px] text-white/60 select-all">
            {newKey}
          </code>
        </div>

        <div className="mt-4 flex gap-3">
          <Button
            onClick={copyKey}
            className="flex-1 h-10 bg-white text-xs text-black hover:bg-white/90"
          >
            {copied ? (
              <FiCheck className="mr-2 size-3.5" />
            ) : (
              <FiCopy className="mr-2 size-3.5" />
            )}
            {copied ? "Copied!" : "Copy new key"}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="h-10 border-white/[0.08] px-4 text-xs text-white/50 hover:bg-white/[0.05] hover:text-white"
          >
            Close
          </Button>
        </div>

        <p className="mt-4 text-[10px] text-white/20">
          Update your runners with this new key. Any runners using the old key will stop working.
        </p>
      </div>
    </div>
  );
}

function CreateKeyModal({
  onClose,
  onCreateKey,
  isCreating,
}: {
  onClose: () => void;
  onCreateKey: (name: string) => void;
  isCreating: boolean;
}) {
  const [keyName, setKeyName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (keyName.trim()) {
      onCreateKey(keyName.trim());
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-xl border border-white/[0.07] bg-[#0a0a0a] p-6 shadow-2xl">
        <button
          onClick={onClose}
          disabled={isCreating}
          className="absolute right-4 top-4 text-white/30 hover:text-white disabled:opacity-50"
        >
          <FiX className="size-5" />
        </button>

        <div className="flex size-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025]">
          <FiKey className="size-5 text-white/50" />
        </div>

        <h2 className="mt-6 text-xl font-semibold tracking-[-0.03em] text-white">
          Create API Key
        </h2>

        <p className="mt-2 text-sm text-white/30">
          Create a new API key for runner authentication.
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <div>
            <label htmlFor="keyName" className="block text-[10px] text-white/30 mb-2">
              Key Name
            </label>
            <input
              id="keyName"
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g., Production, Staging, Dev"
              disabled={isCreating}
              className="w-full rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-sm text-white/70 outline-none placeholder:text-white/20 focus:border-white/20 disabled:opacity-50"
              autoFocus
            />
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              type="submit"
              disabled={!keyName.trim() || isCreating}
              className="flex-1 h-10 bg-white text-xs text-black hover:bg-white/90 disabled:opacity-50"
            >
              {isCreating ? (
                <FiRefreshCw className="mr-2 size-3.5 animate-spin" />
              ) : (
                <FiPlus className="mr-2 size-3.5" />
              )}
              {isCreating ? "Creating..." : "Create key"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
              className="h-10 border-white/[0.08] px-4 text-xs text-white/50 hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
            >
              Cancel
            </Button>
          </div>
        </form>

        <p className="mt-4 text-[10px] text-white/20">
          The key will only be shown once after creation. Make sure to copy it.
        </p>
      </div>
    </div>
  );
}
