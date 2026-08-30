"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiCheck } from "react-icons/fi";

import { Button } from "@/components/ui/button";

import Logo from "@/components/custom/Logo";

type Workspace = {
  id: string;
  name: string;
  slug: string;
};

export default function CompleteOnboardingPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isReady, setIsReady] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Prevent double-run in React Strict Mode
    if (hasChecked.current) return;
    hasChecked.current = true;

    const storedWorkspace = sessionStorage.getItem("onboarding_workspace");
    
    // DEBUG: Log what's in sessionStorage
    console.log("[complete] sessionStorage.onboarding_workspace:", storedWorkspace);
    console.log("[complete] All sessionStorage keys:", Object.keys(sessionStorage));

    if (!storedWorkspace) {
      console.log("[complete] No workspace found, redirecting to /onboarding");
      router.replace("/onboarding");
      return;
    }

    console.log("[complete] Workspace found, setting state");
    setWorkspace(JSON.parse(storedWorkspace));
    setIsReady(true);
  }, [router]);

  function goToDashboard() {
    sessionStorage.removeItem("onboarding_workspace");
    sessionStorage.removeItem("onboarding_runner_connection");
    router.push("/dashboard");
  }

  if (!isReady) {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
        <div className="text-white/30">Loading...</div>
      </main>
    );
  }

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
              Step 3 of 3
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[560px] px-6 pt-8">
        <Progress step={3} />
      </div>

      <div className="mx-auto max-w-[560px] px-6 pb-20 pt-16">
        <div className="flex size-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025]">
          <FiCheck className="size-5 text-white/50" />
        </div>

        <div className="mt-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
            All set
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">
            Your workspace is ready.
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/30">
            Your runner is connected and ready to execute computer actions. You
            can now start creating automations in your workspace.
          </p>
        </div>

        <div className="mt-12 flex justify-end">
          <Button
            onClick={goToDashboard}
            className="h-10 bg-white px-5 text-xs text-black hover:bg-white/90"
          >
            Go to dashboard
            <FiArrowRight className="ml-2 size-3" />
          </Button>
        </div>
      </div>
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
