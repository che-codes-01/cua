"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiCheck,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiMonitor,
  FiTerminal,
  FiPackage,
  FiBox,
} from "react-icons/fi";

import { Button } from "@/components/ui/button";

import Logo from "@/components/custom/Logo";
import {
  buildRunnerCommand,
  buildRunnerDockerCommand,
  buildRunnerDockerComposeConfig,
} from "@/lib/runner-command";

type Workspace = {
  id: string;
  name: string;
  slug: string;
};

type Runner = {
  id: string;
  name: string;
  status: string;
};

export default function ConnectRunnerPage() {
  const router = useRouter();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  const [apiKey, setApiKey] = useState("");

  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commandCopied, setCommandCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"terminal" | "docker" | "compose">(
    "terminal"
  );

  const [runners, setRunners] = useState<Runner[]>([]);
  const [checking, setChecking] = useState(true);
  const [hasOnlineRunner, setHasOnlineRunner] = useState(false);

  let command = "";
  try {
    if (workspace && apiKey) {
      if (activeTab === "terminal") {
        command = buildRunnerCommand(apiKey, workspace.id);
      } else if (activeTab === "docker") {
        command = buildRunnerDockerCommand(apiKey, workspace.id);
      } else {
        command = buildRunnerDockerComposeConfig(apiKey, workspace.id);
      }
    }
  } catch (err) {
    console.error("Error building command:", err);
  }

  useEffect(() => {
    const storedWorkspace = sessionStorage.getItem("onboarding_workspace");

    const storedConnection = sessionStorage.getItem("onboarding_runner_connection");

    if (!storedWorkspace || !storedConnection) {
      router.replace("/onboarding");
      return;
    }

    setWorkspace(JSON.parse(storedWorkspace));
    setApiKey(JSON.parse(storedConnection).key);
  }, [router]);

  useEffect(() => {
    if (!workspace) return;

    let active = true;

    async function checkRunner() {
      try {
        const response = await fetch(
          `/api/onboarding/runners?workspaceId=${workspace!.id}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) return;

        const data = await response.json();

        if (!active) return;

        setRunners(data.runners ?? []);

        const online = (data.runners ?? []).some(
          (runner: Runner) => runner.status === "online",
        );

        if (online) setHasOnlineRunner(true);
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    checkRunner();

    const interval = setInterval(checkRunner, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [workspace, router]);

  async function copyKey() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setCommandCopied(true);
    setTimeout(() => setCommandCopied(false), 1800);
  }

  const maskedKey =
    apiKey.length > 0 ? `${apiKey.slice(0, 13)}${"•".repeat(24)}` : "";

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <header className="flex h-20 items-center justify-between border-b border-white/[0.06] px-6 lg:px-10">
        <Logo />

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-[10px] text-white/20">
              {workspace?.name ?? "Workspace"}
            </p>

            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-white/10">
              Step 2 of 3
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[560px] px-6 pt-8">
        <Progress step={2} />
      </div>

      <section className="mx-auto max-w-[680px] px-6 pb-20 pt-14">
        <div className="flex size-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025]">
          <FiMonitor className="size-4 text-white/50" />
        </div>

        <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
          Connect a machine
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Connect your first runner.
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-6 text-white/30">
          A runner connects a machine to your workspace. You can connect as many
          machines as you need using this runner connection.
        </p>

        {/* API key */}

        <div className="mt-10 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0b0b]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <p className="text-xs font-medium text-white/55">
              Runner connection
            </p>

            <p className="mt-1 text-[10px] text-white/20">Default connection</p>
          </div>

          <div className="p-5">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-white/20">
              API key
            </p>

            <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-black/30 p-2">
              <code className="min-w-0 flex-1 overflow-hidden px-2 font-mono text-[10px] text-white/40">
                {showKey ? apiKey : maskedKey}
              </code>

              <button
                onClick={() => setShowKey((value) => !value)}
                className="rounded-md p-2 text-white/20 hover:bg-white/[0.04] hover:text-white/50"
              >
                {showKey ? (
                  <FiEyeOff className="size-3.5" />
                ) : (
                  <FiEye className="size-3.5" />
                )}
              </button>

              <button
                onClick={copyKey}
                className="flex items-center gap-2 rounded-md bg-white/[0.06] px-3 py-2 text-[10px] text-white/50 hover:bg-white/[0.09] hover:text-white"
              >
                {copied ? (
                  <FiCheck className="size-3" />
                ) : (
                  <FiCopy className="size-3" />
                )}

                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <p className="mt-3 text-[10px] leading-5 text-white/20">
              This key is used by runners to authenticate with this workspace.
              Keep it private.
            </p>
          </div>
        </div>

        {/* Installation */}

        <div className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <FiTerminal className="size-3.5 text-white/30" />

            <h2 className="text-xs font-medium text-white/55">
              Start your runner
            </h2>
          </div>

          {/* Tabs */}
          <div className="mb-3 flex gap-2 border-b border-white/[0.06]">
            {[
              { id: "terminal", label: "Terminal", icon: FiTerminal },
              { id: "docker", label: "Docker", icon: FiBox },
              { id: "compose", label: "Compose", icon: FiPackage },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(tab.id as "terminal" | "docker" | "compose")
                  }
                  className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-[10px] font-medium transition ${
                    isActive
                      ? "border-white text-white"
                      : "border-transparent text-white/30 hover:text-white/60"
                  }`}
                >
                  <TabIcon className="size-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Command block */}
          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0b0b]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <span className="font-mono text-[9px] uppercase tracking-wider text-white/20">
                {activeTab === "terminal"
                  ? "Copy & paste"
                  : activeTab === "docker"
                    ? "Docker"
                    : "docker-compose.yml"}
              </span>

              <button
                onClick={copyCommand}
                className="flex items-center gap-2 rounded-md bg-white/[0.06] px-3 py-2 text-[10px] text-white/50 hover:bg-white/[0.09] hover:text-white"
              >
                {commandCopied ? (
                  <FiCheck className="size-3" />
                ) : (
                  <FiCopy className="size-3" />
                )}
                {commandCopied ? "Copied" : "Copy"}
              </button>
            </div>

            <pre className="overflow-x-auto p-5 font-mono text-[10px] leading-6 text-white/40">
              {command}
            </pre>
          </div>

          <p className="mt-4 text-[10px] leading-5 text-white/20">
            Paste this command and run it on the machine you want to connect.
            The runner will start automatically and appear online.
          </p>
        </div>

        {/* Waiting */}

        <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.015] p-5">
          <div className="flex items-center gap-4">
            <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08]">
              {checking ? (
                <>
                  <span className="absolute inset-0 animate-ping rounded-full bg-white/[0.03]" />

                  <FiLoader className="relative size-3.5 animate-spin text-white/40" />
                </>
              ) : (
                <span className="size-2 rounded-full bg-white/20" />
              )}
            </div>

            <div>
              <p className="text-xs text-white/55">
                {runners.length
                  ? `${runners.length} runner detected`
                  : "Waiting for your runner..."}
              </p>

              <p className="mt-1 text-[10px] text-white/20">
                This page automatically detects when your machine connects.
              </p>
            </div>
          </div>

          {runners.length > 0 && (
            <div className="mt-5 space-y-2">
              {runners.map((runner) => (
                <div
                  key={runner.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-black/20 px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`size-1.5 rounded-full ${
                        runner.status === "online"
                          ? "bg-emerald-400"
                          : "bg-white/15"
                      }`}
                    />

                    <span className="text-[10px] text-white/40">
                      {runner.name}
                    </span>
                  </div>

                  <span className="font-mono text-[9px] uppercase text-white/20">
                    {runner.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="border-white/[0.08] bg-white/[0.02] text-xs text-white/30 hover:bg-white/[0.05] hover:text-white"
          >
            Skip for now
          </Button>

          <Button
            onClick={() => router.push("/onboarding/complete")}
            disabled={!hasOnlineRunner}
            className="h-10 bg-white px-5 text-xs text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-white/20"
          >
            {hasOnlineRunner ? "Continue" : "Waiting for runner…"}
            <FiArrowRight className="ml-2 size-3" />
          </Button>
        </div>
      </section>
    </main>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3].map((item, index) => (
        <div key={item} className="flex flex-1 items-center">
          <div
            className={`flex size-6 items-center justify-center rounded-full ${
              item <= step
                ? "bg-white text-black"
                : "border border-white/[0.08] bg-white/[0.02] text-white/20"
            }`}
          >
            {item < step ? (
              <FiCheck className="size-3" />
            ) : (
              <span className="text-[9px]">{item}</span>
            )}
          </div>

          {index < 2 && (
            <div
              className={`h-px flex-1 ${
                item < step ? "bg-white/[0.12]" : "bg-white/[0.06]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
