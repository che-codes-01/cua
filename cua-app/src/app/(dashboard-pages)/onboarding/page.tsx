"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiCheck, FiLayers } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import Logo from "@/components/custom/Logo";

export default function OnboardingPage() {
  const router = useRouter();

  const [workspaceName, setWorkspaceName] = useState("");
  const [connectionName, setConnectionName] = useState("Production");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canContinue =
    workspaceName.trim().length >= 2 &&
    connectionName.trim().length >= 1 &&
    !loading;

  async function createWorkspace() {
    if (!canContinue) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/onboarding/workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: workspaceName,
          runnerConnectionName: connectionName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create workspace.");
      }

      /*
       * The raw key is intentionally passed to the next screen
       * only once.
       */
      sessionStorage.setItem(
        "onboarding_runner_connection",
        JSON.stringify(data.runnerConnection),
      );

      sessionStorage.setItem(
        "onboarding_workspace",
        JSON.stringify(data.workspace),
      );

      router.push("/onboarding/connect");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <header className="flex h-20 items-center justify-between border-b border-white/[0.06] px-6 lg:px-10">
        <Logo />
      </header>

      <div className="mx-auto max-w-[560px] px-6 pb-20 pt-16">
        <div className="flex size-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025]">
          <FiLayers className="size-4 text-white/50" />
        </div>

        <div className="mt-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
            Step 1 of 3
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">
            Create your workspace.
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/30">
            Your workspace is where your connected machines, runner connections,
            and computer actions live.
          </p>
        </div>

        <div className="mt-12 space-y-7">
          <div>
            <label className="mb-2.5 block text-[11px] text-white/50">
              Workspace name
            </label>

            <Input
              autoFocus
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createWorkspace();
                }
              }}
              placeholder="Acme Automation"
              className="h-12 border-white/[0.08] bg-white/[0.025] text-sm placeholder:text-white/15 focus-visible:border-white/[0.2] focus-visible:ring-0"
            />

            <p className="mt-2 text-[10px] text-white/15">
              You can change this later.
            </p>
          </div>

          <div>
            <label className="mb-2.5 block text-[11px] text-white/50">
              First runner connection
            </label>

            <Input
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              placeholder="Production"
              className="h-12 border-white/[0.08] bg-white/[0.025] text-sm placeholder:text-white/15 focus-visible:border-white/[0.2] focus-visible:ring-0"
            />

            <p className="mt-2 text-[10px] leading-5 text-white/15">
              A runner connection groups machines that use the same API key.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-400/10 bg-red-400/[0.03] px-4 py-3 text-[11px] text-red-300/60">
            {error}
          </div>
        )}

        <div className="mt-10 flex items-center justify-between">
          <p className="text-[10px] text-white/15">
            You can connect multiple machines later.
          </p>

          <Button
            onClick={createWorkspace}
            disabled={!canContinue}
            className="h-10 bg-white px-5 text-xs text-black hover:bg-white/90 disabled:bg-white/[0.06] disabled:text-white/20"
          >
            {loading ? "Creating..." : "Continue"}

            {!loading && <FiArrowRight className="ml-2 size-3" />}
          </Button>
        </div>
      </div>
    </main>
  );
}
