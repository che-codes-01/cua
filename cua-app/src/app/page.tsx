"use client";

import {
  FiArrowRight,
  FiCheck,
  FiChevronRight,
  FiCode,
  FiCommand,
  FiEye,
  FiGithub,
  FiGlobe,
  FiKey,
  FiMousePointer,
  FiPlay,
  FiServer,
  FiShield,
  FiTerminal,
  FiZap,
} from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import Logo from "@/components/custom/Logo";

const code = `const session = await computer.sessions.create({
  viewport: {
    width: 1440,
    height: 900,
  },
});

const result = await session.run({
  task: "Download this month's invoices",
});

console.log(result.artifacts);`;

const features = [
  {
    icon: FiEye,
    title: "See",
    description:
      "High-fidelity screenshots and structured page state give agents the context they need to understand an interface.",
  },
  {
    icon: FiMousePointer,
    title: "Act",
    description:
      "A native computer-control layer for clicking, typing, scrolling, dragging, and keyboard interaction.",
  },
  {
    icon: FiShield,
    title: "Verify",
    description:
      "Every action can be grounded and verified before the next step is taken.",
  },
  {
    icon: FiZap,
    title: "Recover",
    description:
      "When an action misses, the runtime can re-observe the environment and recover instead of blindly continuing.",
  },
];

const integrations = [
  {
    icon: FiCommand,
    name: "AI Agents",
  },
  {
    icon: FiGlobe,
    name: "Web Apps",
  },
  {
    icon: FiTerminal,
    name: "REST API",
  },
  {
    icon: FiCode,
    name: "SDK",
  },
  {
    icon: FiServer,
    name: "n8n",
  },
  {
    icon: FiKey,
    name: "Secrets",
  },
];

const executionSteps = [
  ["observe", "Screenshot captured", "120ms"],
  ["ground", "Target resolved", "18ms"],
  ["act", "click(846, 612)", "31ms"],
  ["verify", "Navigation detected", "84ms"],
  ["✓", "Action successful", "—"],
];

function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-420px] h-[800px] w-[1000px] -translate-x-1/2 rounded-full bg-white/[0.025] blur-[160px]" />

      <div className="absolute left-[-200px] top-[35%] h-[500px] w-[500px] rounded-full bg-white/[0.015] blur-[140px]" />

      <div className="absolute right-[-200px] top-[60%] h-[500px] w-[500px] rounded-full bg-white/[0.015] blur-[140px]" />
    </div>
  );
}

function BrowserDemo() {
  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="absolute -inset-10 rounded-[40px] bg-white/[0.015] blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b0b0c] shadow-2xl shadow-black/60">
        {/* Browser toolbar */}
        <div className="flex h-12 items-center gap-3 border-b border-white/[0.07] bg-[#101011] px-4">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-white/10" />
            <span className="size-2.5 rounded-full bg-white/10" />
            <span className="size-2.5 rounded-full bg-white/10" />
          </div>

          <div className="mx-auto flex h-7 w-[55%] items-center justify-center rounded-md border border-white/[0.07] bg-black/30 font-mono text-[10px] text-white/25">
            app.example.com/invoices
          </div>

          <div className="w-10" />
        </div>

        <div className="relative grid min-h-[440px] grid-cols-[180px_1fr]">
          {/* Sidebar */}
          <div className="border-r border-white/[0.07] bg-[#0d0d0e] p-4">
            <div className="mb-8 text-[10px] font-semibold tracking-widest text-white/30">
              ACME INC.
            </div>

            {["Overview", "Customers", "Invoices", "Settings"].map(
              (item, index) => (
                <div
                  key={item}
                  className={`mb-1 flex items-center gap-2 rounded-md px-3 py-2.5 text-[11px] ${
                    index === 2
                      ? "bg-white/[0.07] text-white/75"
                      : "text-white/25"
                  }`}
                >
                  <span className="size-1 rounded-full bg-current opacity-60" />
                  {item}
                </div>
              ),
            )}
          </div>

          {/* Main content */}
          <div className="p-9">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium tracking-tight text-white/85">
                  Invoices
                </p>

                <p className="mt-1 text-xs text-white/25">
                  Manage and download your invoices
                </p>
              </div>

              <div className="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[10px] text-white/35">
                This month
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-white/[0.08]">
              {[
                ["INV-0428", "Aug 28, 2026", "$4,820.00"],
                ["INV-0417", "Aug 14, 2026", "$2,140.00"],
                ["INV-0403", "Aug 02, 2026", "$8,390.00"],
              ].map(([id, date, amount]) => (
                <div
                  key={id}
                  className="flex items-center border-b border-white/[0.05] px-5 py-4 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-[11px] text-white/55">{id}</p>

                    <p className="mt-1 text-[9px] text-white/20">{date}</p>
                  </div>

                  <p className="mr-8 text-[11px] text-white/45">{amount}</p>

                  <div className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[9px] text-white/25">
                    PDF
                  </div>
                </div>
              ))}
            </div>

            {/* Agent cursor */}
            <div className="absolute left-[67%] top-[63%]">
              <div className="animate-pulse">
                <FiMousePointer className="size-6 fill-white text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]" />
              </div>

              <div className="ml-4 mt-1 rounded-md border border-white/10 bg-black/80 px-2.5 py-1.5 font-mono text-[9px] text-white/50 shadow-xl backdrop-blur">
                computer.click
              </div>
            </div>
          </div>
        </div>

        {/* Runtime status */}
        <div className="flex items-center justify-between border-t border-white/[0.07] bg-black/30 px-5 py-3">
          <div className="flex items-center gap-2 font-mono text-[10px] text-white/30">
            <span className="size-1.5 rounded-full bg-emerald-400/80" />
            session active
          </div>

          <div className="flex items-center gap-5 font-mono text-[9px] text-white/20">
            <span>step 7 / 12</span>
            <span>2.4s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeWindow() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090909] shadow-2xl">
      <div className="flex h-10 items-center border-b border-white/[0.07] px-4">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-white/10" />
          <span className="size-2 rounded-full bg-white/10" />
          <span className="size-2 rounded-full bg-white/10" />
        </div>

        <span className="ml-4 font-mono text-[10px] text-white/20">
          agent.ts
        </span>
      </div>

      <pre className="overflow-x-auto p-6 font-mono text-xs leading-6 text-white/45">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080808] text-white selection:bg-white/20">
      <AmbientBackground />

      {/* NAVIGATION */}

      <nav className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-8 text-[13px] text-white/35 md:flex">
          <a href="#product" className="transition-colors hover:text-white/80">
            Product
          </a>

          <a
            href="#developers"
            className="transition-colors hover:text-white/80"
          >
            Developers
          </a>

          <a href="#n8n" className="transition-colors hover:text-white/80">
            n8n
          </a>

          <a
            href="#infrastructure"
            className="transition-colors hover:text-white/80"
          >
            Infrastructure
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Button className="hidden rounded-md border border-white/10 bg-white/[0.08] text-white shadow-none hover:bg-white/[0.12] sm:flex">
            Start building
            <FiArrowRight className="ml-2 size-3.5" />
          </Button>
        </div>
      </nav>

      {/* HERO */}

      <section className="relative z-10 px-6 pb-28 pt-24 lg:px-8 lg:pt-32">
        <div className="mx-auto max-w-5xl text-center">
          <Badge
            variant="outline"
            className="rounded-full border-white/[0.1] bg-white/[0.025] px-4 py-1.5 font-mono text-[10px] font-normal tracking-wide text-white/40"
          >
            <span className="mr-2 inline-block size-1.5 rounded-full bg-emerald-400/80" />
            COMPUTER USE INFRASTRUCTURE
          </Badge>

          <h1 className="mx-auto mt-9 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.055em] text-white sm:text-6xl lg:text-[84px] lg:leading-[0.98]">
            Give AI{" "}
            <span className="text-white/35">
              eyes,
              <br className="sm:hidden" /> hands,
            </span>{" "}
            and control.
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-pretty text-base leading-7 text-white/35 sm:text-lg">
            A purpose-built computer-use runtime for AI agents. See screens,
            interact with software, verify actions, and recover when things go
            wrong.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 rounded-lg bg-white px-6 text-black hover:bg-white/90"
            >
              Start building
              <FiArrowRight className="ml-2 size-4" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-lg border-white/10 bg-white/[0.025] px-6 text-white/60 hover:bg-white/[0.06] hover:text-white"
            >
              <FiTerminal className="mr-2 size-4" />
              Read the docs
            </Button>
          </div>

          <div className="mt-7 flex items-center justify-center gap-2 font-mono text-[10px] text-white/20">
            <span>REST API</span>
            <span>·</span>
            <span>SDK</span>
            <span>·</span>
            <span>n8n</span>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-6xl">
          <BrowserDemo />
        </div>
      </section>

      {/* STATEMENT */}

      <section className="border-y border-white/[0.06] bg-white/[0.015] px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xl font-medium tracking-tight text-white/55 sm:text-2xl">
            APIs give agents access to structured data.
            <br />
            <span className="text-white">
              Computer use gives them access to everything else.
            </span>
          </p>
        </div>
      </section>

      {/* FEATURES */}

      <section id="product" className="relative px-6 py-32 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25">
              The runtime
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Computer use, engineered for reliability.
            </h2>

            <p className="mt-6 text-base leading-7 text-white/35">
              Your agent decides what to do. Our runtime handles the difficult
              part of actually doing it.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group bg-[#090909] p-7 transition-colors hover:bg-[#0e0e0e]"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                    <Icon className="size-4 text-white/55" />
                  </div>

                  <h3 className="mt-6 text-sm font-medium">{feature.title}</h3>

                  <p className="mt-3 text-sm leading-6 text-white/30">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* EXECUTION LOOP */}

      <section
        id="infrastructure"
        className="relative border-y border-white/[0.06] bg-white/[0.015] px-6 py-32 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25">
                Execution engine
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Don't trust the first click.
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/35">
                Models can be uncertain. The execution layer shouldn't be. Every
                interaction can be grounded against the environment and verified
                before the agent moves forward.
              </p>

              <div className="mt-9 flex flex-wrap gap-2">
                {[
                  "Observe",
                  "Reason",
                  "Ground",
                  "Act",
                  "Verify",
                  "Recover",
                ].map((item, index) => (
                  <div key={item} className="flex items-center">
                    <div className="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2 font-mono text-[10px] text-white/40">
                      <span className="mr-2 text-white/15">0{index + 1}</span>
                      {item}
                    </div>

                    {index < 5 && (
                      <FiChevronRight className="mx-1 size-3 text-white/10" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Card className="relative overflow-hidden border-white/[0.08] bg-[#090909] p-0 shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.04),transparent_60%)]" />

              <div className="relative p-7">
                <div className="flex items-center justify-between border-b border-white/[0.07] pb-5">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-400/80" />

                    <span className="font-mono text-[10px] text-white/40">
                      agent execution
                    </span>
                  </div>

                  <span className="font-mono text-[9px] text-white/15">
                    sess_8f3a2
                  </span>
                </div>

                <div className="space-y-2.5 py-6">
                  {executionSteps.map(([step, text, time], index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-md border border-white/[0.05] bg-white/[0.015] px-3 py-3"
                    >
                      <span
                        className={`font-mono text-[9px] ${
                          step === "✓" ? "text-emerald-400/80" : "text-white/30"
                        }`}
                      >
                        {step}
                      </span>

                      <span className="flex-1 font-mono text-[10px] text-white/35">
                        {text}
                      </span>

                      <span className="font-mono text-[9px] text-white/15">
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* API */}

      <section id="developers" className="px-6 py-32 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25">
                Developer API
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                One interface.
                <br />
                Every computer.
              </h2>

              <p className="mt-6 text-base leading-7 text-white/35">
                Create a session and give your agent a real execution
                environment without managing browsers, displays, or desktop
                infrastructure yourself.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Isolated computer sessions",
                  "Persistent browser profiles",
                  "Screenshots and artifacts",
                  "Session replay and audit logs",
                  "Configurable safety policies",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm text-white/40"
                  >
                    <div className="flex size-5 items-center justify-center rounded-full bg-white/[0.05]">
                      <FiCheck className="size-3 text-white/55" />
                    </div>

                    {item}
                  </div>
                ))}
              </div>
            </div>

            <CodeWindow />
          </div>
        </div>
      </section>

      {/* N8N */}

      <section id="n8n" className="relative px-6 py-32 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0a0a]">
          <div className="absolute right-[-100px] top-[-150px] h-[500px] w-[500px] rounded-full bg-white/[0.025] blur-[130px]" />

          <div className="relative grid gap-14 p-8 lg:grid-cols-2 lg:p-14">
            <div>
              <Badge
                variant="outline"
                className="border-white/[0.1] bg-white/[0.025] font-mono text-[10px] font-normal text-white/40"
              >
                n8n integration
              </Badge>

              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.04em]">
                Give your n8n agents a computer.
              </h2>

              <p className="mt-5 max-w-lg text-sm leading-6 text-white/30">
                Add computer use as a native tool inside your n8n AI Agent
                workflows. Your agent can operate software that has no API,
                while your workflow handles everything around it.
              </p>

              <Button className="mt-8 rounded-md bg-white text-black hover:bg-white/90">
                Explore the n8n integration
                <FiArrowRight className="ml-2 size-3.5" />
              </Button>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-md">
                {[
                  ["01", "Trigger", "Webhook received"],
                  ["02", "AI Agent", "Reason about task"],
                  ["03", "Computer Use", "Operate browser"],
                  ["04", "Artifact", "Invoice.pdf"],
                  ["05", "Workflow", "Continue execution"],
                ].map(([number, title, description], index) => (
                  <div key={title}>
                    <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] font-mono text-[9px] text-white/25">
                        {number}
                      </div>

                      <div>
                        <p className="text-xs font-medium text-white/65">
                          {title}
                        </p>

                        <p className="mt-1 text-[10px] text-white/20">
                          {description}
                        </p>
                      </div>

                      {index < 4 && (
                        <FiChevronRight className="ml-auto size-3 text-white/10" />
                      )}
                    </div>

                    {index < 4 && (
                      <div className="ml-8 h-2 w-px bg-white/[0.07]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}

      <section className="border-y border-white/[0.06] bg-white/[0.015] px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/20">
            Built for your stack
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {integrations.map(({ icon: Icon, name }) => (
              <div
                key={name}
                className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.015] p-6 transition hover:border-white/[0.14] hover:bg-white/[0.03]"
              >
                <Icon className="size-5 text-white/30" />

                <span className="text-xs text-white/25">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}

      <section className="relative px-6 py-36 lg:px-8">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02] blur-[150px]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <HiOutlineSparkles className="mx-auto size-5 text-white/30" />

          <h2 className="mt-7 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
            Give your agents
            <br />
            <span className="text-white/30">a computer to operate.</span>
          </h2>

          <p className="mx-auto mt-7 max-w-xl text-sm leading-6 text-white/25">
            Build agents that don't stop at APIs. Give them the ability to
            interact with the software your users already use.
          </p>

          <div className="mt-10 flex justify-center gap-3">
            <Button
              size="lg"
              className="h-12 rounded-lg bg-white px-7 text-black hover:bg-white/90"
            >
              Start building
              <FiArrowRight className="ml-2 size-4" />
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="h-12 rounded-lg text-white/35 hover:bg-white/[0.05] hover:text-white"
            >
              <FiPlay className="mr-2 size-4" />
              See it in action
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-white/[0.06] px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Logo />

          <div className="flex items-center gap-6 text-xs text-white/20">
            <a href="#" className="transition hover:text-white/50">
              Documentation
            </a>

            <a href="#" className="transition hover:text-white/50">
              GitHub
            </a>

            <a href="#" className="transition hover:text-white/50">
              Status
            </a>

            <a href="#" className="transition hover:text-white/50">
              Privacy
            </a>
          </div>

          <FiGithub className="hidden size-4 text-white/20 sm:block" />
        </div>
      </footer>
    </main>
  );
}
