"use client";

import {
  FiActivity,
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiPlus,
  FiCheck,
  FiChevronRight,
  FiCode,
  FiCommand,
  FiCopy,
  FiCpu,
  FiExternalLink,
  FiHelpCircle,
  FiKey,
  FiMonitor,
  FiPlay,
  FiSearch,
  FiServer,
  FiSettings,
  FiShield,
  FiTerminal,
  FiUsers,
  FiWifi,
  FiZap,
} from "react-icons/fi";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import Logo from "@/components/custom/Logo";

const navigation = [
  {
    title: "GETTING STARTED",
    items: ["Overview", "Quickstart", "Connect a machine", "Your first action"],
  },
  {
    title: "RUNNERS",
    items: ["Runners", "Add a runner", "Runner status", "Runner settings"],
  },
  {
    title: "COMPUTER ACTIONS",
    items: ["Sessions", "Actions", "Screenshots", "Action results"],
  },
  {
    title: "INTEGRATIONS",
    items: ["n8n", "API", "AI agents"],
  },
  {
    title: "ACCOUNT",
    items: ["Team members", "API keys", "Security"],
  },
];

const actionExamples = [
  {
    name: "Screenshot",
    description: "Capture the current screen of a connected machine.",
    icon: FiMonitor,
  },
  {
    name: "Click",
    description: "Click at a specific location on the screen.",
    icon: FiActivity,
  },
  {
    name: "Type",
    description: "Enter text using the connected machine.",
    icon: FiCommand,
  },
  {
    name: "Keyboard",
    description: "Send keyboard input to the active machine.",
    icon: FiTerminal,
  },
];

function CodeBlock({
  children,
  label = "Example",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0b0b]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/20">
          {label}
        </span>

        <button className="text-white/20 transition hover:text-white/50">
          <FiCopy className="size-3" />
        </button>
      </div>

      <pre className="overflow-x-auto p-5 font-mono text-[11px] leading-6 text-white/40">
        {children}
      </pre>
    </div>
  );
}

function NavSection({
  title,
  items,
  active,
}: {
  title: string;
  items: string[];
  active?: string;
}) {
  return (
    <div>
      <p className="mb-3 px-3 font-mono text-[9px] tracking-[0.18em] text-white/20">
        {title}
      </p>

      <div className="space-y-0.5">
        {items.map((item) => {
          const isActive = item === active;

          return (
            <a
              key={item}
              href="#"
              className={`group flex items-center rounded-md px-3 py-2 text-[12px] transition ${
                isActive
                  ? "bg-white/[0.06] text-white/75"
                  : "text-white/30 hover:bg-white/[0.03] hover:text-white/60"
              }`}
            >
              {isActive && (
                <span className="mr-2 size-1 rounded-full bg-white/70" />
              )}

              {item}

              {!isActive && (
                <FiChevronRight className="ml-auto size-3 text-white/0 transition group-hover:text-white/20" />
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function Topbar() {
  return (
    <header className="sticky top-0 z-50 h-20 border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1500px] items-center px-6 lg:px-8">
        <div className="flex items-center gap-4 lg:w-64">
          <Logo />

          <div className="hidden h-5 w-px bg-white/[0.08] lg:block" />

          <span className="hidden font-mono text-[10px] tracking-widest text-white/20 lg:block">
            DOCS
          </span>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="mr-4 hidden items-center gap-6 text-[12px] text-white/30 md:flex">
            <a href="#" className="text-white/60 transition hover:text-white">
              Documentation
            </a>

            <a href="#" className="transition hover:text-white">
              Help
            </a>

            <a href="#" className="transition hover:text-white">
              Status
            </a>
          </div>

          <Button
            size="sm"
            className="hidden bg-white text-black hover:bg-white/90 sm:flex"
          >
            Dashboard
            <FiArrowRight className="ml-2 size-3" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] lg:block">
      <div className="sticky top-20 h-[calc(100vh-80px)] overflow-y-auto px-6 py-8">
        <div className="mb-8 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
          <FiSearch className="size-3 text-white/25" />

          <span className="text-xs text-white/25">Search documentation</span>

          <kbd className="ml-auto rounded border border-white/[0.07] px-1.5 py-0.5 font-mono text-[8px] text-white/15">
            ⌘K
          </kbd>
        </div>

        <nav className="space-y-8">
          <NavSection
            title="GETTING STARTED"
            active="Overview"
            items={[
              "Overview",
              "Quickstart",
              "Connect a machine",
              "Your first action",
            ]}
          />

          <NavSection
            title="RUNNERS"
            items={[
              "Runners",
              "Add a runner",
              "Runner status",
              "Runner settings",
            ]}
          />

          <NavSection
            title="COMPUTER ACTIONS"
            items={["Sessions", "Actions", "Screenshots", "Action results"]}
          />

          <NavSection
            title="INTEGRATIONS"
            items={["n8n", "API", "AI agents"]}
          />

          <NavSection
            title="ACCOUNT"
            items={["Team members", "API keys", "Security"]}
          />
        </nav>

        <div className="mt-10 border-t border-white/[0.06] pt-6">
          <a
            href="#"
            className="flex items-center gap-3 px-3 text-[11px] text-white/25 transition hover:text-white/50"
          >
            <FiHelpCircle className="size-3.5" />
            Help center
            <FiExternalLink className="ml-auto size-3" />
          </a>
        </div>
      </div>
    </aside>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-5 transition hover:border-white/[0.11] hover:bg-white/[0.025]">
      <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025]">
        <Icon className="size-3.5 text-white/40" />
      </div>

      <p className="mt-4 text-xs font-medium text-white/60">{title}</p>

      <p className="mt-2 text-[11px] leading-5 text-white/25">{description}</p>
    </div>
  );
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Topbar />

      <div className="mx-auto flex max-w-[1500px]">
        <Sidebar />

        <article className="min-w-0 flex-1">
          <div className="mx-auto max-w-4xl px-6 py-12 lg:px-12 lg:py-16 xl:px-20">
            {/* Breadcrumb */}

            <div className="mb-8 flex items-center gap-2 font-mono text-[10px] text-white/20">
              <span>Documentation</span>
              <FiChevronRight className="size-3" />
              <span className="text-white/40">Getting started</span>
            </div>

            {/* Page header */}

            <div>
              <Badge
                variant="outline"
                className="border-white/[0.08] bg-white/[0.02] font-mono text-[9px] font-normal text-white/30"
              >
                GETTING STARTED
              </Badge>

              <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Welcome to your
                <br />
                computer workspace.
              </h1>

              <p className="mt-6 max-w-2xl text-[15px] leading-7 text-white/35">
                Connect your machines, give them capabilities, and let your
                workflows and AI agents perform actions on them.
              </p>
            </div>

            {/* Intro */}

            <div className="mt-10 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiZap className="size-3.5 text-white/50" />
                </div>

                <div>
                  <p className="text-xs font-medium text-white/65">
                    How it works
                  </p>

                  <p className="mt-2 text-xs leading-6 text-white/30">
                    A runner connects your machine to your workspace. Once it is
                    online, you can open a session and send computer actions to
                    it. The same capabilities can also be used from n8n and AI
                    agent workflows.
                  </p>
                </div>
              </div>
            </div>

            {/* Core concepts */}

            <section className="mt-20">
              <div className="mb-7">
                <h2 className="text-2xl font-semibold tracking-tight">
                  The basics
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/30">
                  There are three things you need to know.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <FeatureCard
                  icon={FiCpu}
                  title="Runner"
                  description="A lightweight app that connects a machine to your workspace."
                />

                <FeatureCard
                  icon={FiActivity}
                  title="Session"
                  description="A temporary connection to a specific runner."
                />

                <FeatureCard
                  icon={FiCommand}
                  title="Action"
                  description="An instruction performed on the machine."
                />
              </div>
            </section>

            {/* Quickstart */}

            <section id="quickstart" className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiPlay className="size-3.5 text-white/45" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Quickstart
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                Get a runner connected in 5 minutes. Copy & paste ready commands.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  {
                    number: "01",
                    title: "Get API key",
                    description:
                      "Go to workspace settings to generate your API key",
                  },
                  {
                    number: "02",
                    title: "Run runner",
                    description:
                      "npx --yes github:che-codes-01/cua-runner --service-url <url> --api-key <key>",
                  },
                  {
                    number: "03",
                    title: "Machine appears online",
                    description:
                      "Your runner connects automatically and shows in your workspace",
                  },
                  {
                    number: "04",
                    title: "Start executing actions",
                    description:
                      "Use sessions to control your machine remotely",
                  },
                ].map((step) => (
                  <div
                    key={step.number}
                    className="flex gap-5 rounded-xl border border-white/[0.07] bg-white/[0.015] p-5"
                  >
                    <span className="font-mono text-[9px] text-white/15">
                      {step.number}
                    </span>

                    <div>
                      <p className="text-xs font-medium text-white/60">
                        {step.title}
                      </p>

                      <p className="mt-1.5 text-[11px] leading-5 text-white/25">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Connect machine */}

            <section id="connect" className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiMonitor className="size-3.5 text-white/45" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Connect a machine
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                Install the CUA runner on any machine to connect it to your workspace.
              </p>

              <h3 className="mt-10 text-sm font-medium text-white/60">
                1. Run the runner
              </h3>

              <p className="mt-2 text-[12px] leading-6 text-white/30">
                Execute this command on your machine:
              </p>

              <CodeBlock label="Run">
                {`npx --yes github:che-codes-01/cua-runner --service-url https://cua-service.vercel.app --api-key YOUR_API_KEY`}
              </CodeBlock>

              <h3 className="mt-8 text-sm font-medium text-white/60">
                2. Get your API key
              </h3>

              <p className="mt-2 text-[12px] leading-6 text-white/30">
                Go to onboarding in your workspace to generate an API key. The key starts with <code>cak_live_</code>.
              </p>

              <h3 className="mt-8 text-sm font-medium text-white/60">
                Docker
              </h3>

              <p className="mt-2 text-[12px] leading-6 text-white/30">
                Run runner in Docker:
              </p>

              <CodeBlock label="docker run">
                {`docker run -d \\
  -e COMPUTER_ACTIONS_SERVICE_URL="https://cua-service.vercel.app" \\
  -e COMPUTER_ACTIONS_SERVICE_API_KEY="cak_live_..." \\
  -e RUNNER_NAME="docker-runner" \\
  node:20-alpine npx --yes github:che-codes-01/cua-runner --service-url https://cua-service.vercel.app --api-key cak_live_...`}
              </CodeBlock>

              <h3 className="mt-8 text-sm font-medium text-white/60">
                Docker Compose
              </h3>

              <p className="mt-2 text-[12px] leading-6 text-white/30">
                Create <code>docker-compose.yml</code>:
              </p>

              <CodeBlock label="docker-compose.yml">
                {`version: "3.8"

services:
  runner:
    image: node:20-alpine
    environment:
      COMPUTER_ACTIONS_SERVICE_URL: https://cua-service.vercel.app
      COMPUTER_ACTIONS_SERVICE_API_KEY: cak_live_XXXX...
      RUNNER_NAME: compose-runner
    command: npx --yes github:che-codes-01/cua-runner --service-url https://cua-service.vercel.app --api-key cak_live_XXXX...
    restart: unless-stopped`}
              </CodeBlock>

              <p className="mt-4 text-[12px] leading-6 text-white/30">
                Start it:
              </p>

              <CodeBlock label="Terminal">
                {`docker-compose up -d`}
              </CodeBlock>

              <h3 className="mt-8 text-sm font-medium text-white/60">
                Systemd Service (Linux)
              </h3>

              <p className="mt-2 text-[12px] leading-6 text-white/30">
                Create <code>/etc/systemd/system/cua-runner.service</code>:
              </p>

              <CodeBlock label="/etc/systemd/system/cua-runner.service">
                {`[Unit]
Description=CUA Runner
After=network.target

[Service]
Type=simple
User=cua
Environment="RUNNER_API_KEY=cak_live_..."
Environment="RUNNER_SERVICE_URL=https://your-domain.com"
Environment="RUNNER_NAME=linux-runner"
ExecStart=/usr/local/bin/cua-runner start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target`}
              </CodeBlock>

              <p className="mt-4 text-[12px] leading-6 text-white/30">
                Enable & start:
              </p>

              <CodeBlock label="Terminal">
                {`sudo systemctl enable cua-runner
sudo systemctl start cua-runner
sudo systemctl status cua-runner`}
              </CodeBlock>

              <div className="mt-6 rounded-xl border border-emerald-400/[0.1] bg-emerald-400/[0.025] p-5">
                <div className="flex gap-3">
                  <FiCheck className="mt-0.5 size-4 shrink-0 text-emerald-400/60" />

                  <div>
                    <p className="text-xs font-medium text-emerald-300/70">
                      Runner connected
                    </p>

                    <p className="mt-1.5 text-[11px] leading-5 text-emerald-200/30">
                      Once the runner starts, it will automatically appear as online in your workspace.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Runners */}

            <section id="runners" className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiServer className="size-3.5 text-white/45" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Runners
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                Runners are the machines available to your workspace. Each
                runner has a name, status, labels, and connection information.
              </p>

              <div className="mt-8 overflow-hidden rounded-xl border border-white/[0.08]">
                <div className="grid grid-cols-3 border-b border-white/[0.06] bg-white/[0.025] px-5 py-3 font-mono text-[9px] uppercase tracking-wider text-white/20">
                  <span>Status</span>
                  <span>Meaning</span>
                  <span>Actions</span>
                </div>

                {[
                  [
                    "Online",
                    "The machine is connected and ready.",
                    "Available",
                  ],
                  [
                    "Offline",
                    "The runner is not currently connected.",
                    "Unavailable",
                  ],
                  ["Busy", "The machine is currently being used.", "In use"],
                ].map(([status, meaning, action]) => (
                  <div
                    key={status}
                    className="grid grid-cols-3 border-b border-white/[0.05] px-5 py-4 last:border-0"
                  >
                    <span className="flex items-center gap-2 text-[10px] text-white/45">
                      <span
                        className={`size-1.5 rounded-full ${
                          status === "Online"
                            ? "bg-emerald-400/60"
                            : status === "Busy"
                              ? "bg-yellow-400/50"
                              : "bg-white/15"
                        }`}
                      />

                      {status}
                    </span>

                    <span className="text-[10px] text-white/25">{meaning}</span>

                    <span className="text-[10px] text-white/25">{action}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Sessions */}

            <section id="sessions" className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiWifi className="size-3.5 text-white/45" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Sessions
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                A session gives you temporary access to a specific runner. Start
                a session when you want to perform actions on a machine.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <FeatureCard
                  icon={FiPlus}
                  title="Start"
                  description="Choose an online runner and start a session."
                />

                <FeatureCard
                  icon={FiCommand}
                  title="Use"
                  description="Send actions while your session is active."
                />

                <FeatureCard
                  icon={FiCheck}
                  title="Finish"
                  description="Close the session when you are done."
                />
              </div>
            </section>

            {/* Actions */}

            <section id="actions" className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiCommand className="size-3.5 text-white/45" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Computer actions
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                Actions are the operations performed by a runner. Your workflows
                can use actions to interact with applications, browsers, and the
                desktop.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {actionExamples.map((action) => (
                  <FeatureCard
                    key={action.name}
                    icon={action.icon}
                    title={action.name}
                    description={action.description}
                  />
                ))}
              </div>

              <h3 className="mt-10 text-sm font-medium text-white/60">
                Sending an action
              </h3>

              <p className="mt-2 text-[12px] leading-6 text-white/30">
                Actions are sent to the active session. The runner performs the
                action and returns its result.
              </p>

              <CodeBlock label="Action">
                {`{
  "type": "screenshot"
}`}
              </CodeBlock>
            </section>

            {/* Screenshots */}

            <section id="screenshots" className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiMonitor className="size-3.5 text-white/45" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Screenshots
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                Use screenshots to understand the current state of the machine
                before or after performing an action.
              </p>

              <div className="mt-8 rounded-xl border border-white/[0.07] bg-white/[0.015] p-5">
                <div className="flex items-center gap-3">
                  <FiMonitor className="size-4 text-white/30" />

                  <span className="font-mono text-[10px] text-white/40">
                    screenshot
                  </span>
                </div>

                <p className="mt-4 text-[11px] leading-5 text-white/25">
                  Screenshots are returned as part of the action result and can
                  be passed to your next workflow step.
                </p>
              </div>
            </section>

            {/* n8n */}

            <section id="n8n" className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiZap className="size-3.5 text-white/45" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">n8n</h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                Use the n8n integration to give your workflows access to your
                connected machines.
              </p>

              <div className="my-8 rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                    <FiZap className="size-4 text-white/40" />
                  </div>

                  <FiArrowRight className="size-4 text-white/15" />

                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-2">
                    <span className="font-mono text-[10px] text-white/35">
                      Computer Action
                    </span>
                  </div>

                  <FiArrowRight className="size-4 text-white/15" />

                  <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                    <FiCpu className="size-4 text-white/40" />
                  </div>
                </div>

                <p className="mt-5 text-[10px] leading-5 text-white/20">
                  Your workflow → Computer Action → Connected machine
                </p>
              </div>

              <p className="text-[12px] leading-6 text-white/30">
                This makes computer actions available alongside the other tools
                in your n8n workflows and AI agents.
              </p>

              <Button
                variant="outline"
                className="mt-6 border-white/[0.08] bg-white/[0.02] text-xs text-white/45 hover:bg-white/[0.05] hover:text-white"
              >
                View n8n setup
                <FiArrowRight className="ml-2 size-3" />
              </Button>
            </section>

            {/* API */}

            <section id="api" className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiCode className="size-3.5 text-white/45" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">API</h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                The API lets you control runners and sessions from your own
                applications and automation tools.
              </p>

              <div className="mt-8 space-y-2">
                {[
                  ["GET", "/api/runners", "View your runners"],
                  ["POST", "/api/sessions", "Start a session"],
                  ["POST", "/api/sessions/:id/actions", "Run an action"],
                  ["DELETE", "/api/sessions/:id", "End a session"],
                ].map(([method, path, description]) => (
                  <div
                    key={`${method}-${path}`}
                    className="flex items-center gap-4 rounded-lg border border-white/[0.07] bg-white/[0.015] px-4 py-3.5"
                  >
                    <span className="w-10 font-mono text-[9px] text-emerald-400/50">
                      {method}
                    </span>

                    <code className="font-mono text-[10px] text-white/40">
                      {path}
                    </code>

                    <span className="ml-auto hidden text-[10px] text-white/20 sm:block">
                      {description}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="mt-6 border-white/[0.08] bg-white/[0.02] text-xs text-white/45 hover:bg-white/[0.05] hover:text-white"
              >
                Open API reference
                <FiExternalLink className="ml-2 size-3" />
              </Button>
            </section>

            {/* Security */}

            <section id="security" className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiShield className="size-3.5 text-white/45" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Security
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                Your machines remain under your control. The runner establishes
                the connection and receives actions only through your workspace.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  {
                    icon: FiKey,
                    title: "API keys",
                    description:
                      "Use workspace credentials when connecting runners and applications.",
                  },
                  {
                    icon: FiUsers,
                    title: "Team access",
                    description:
                      "Control who can access your workspace and its connected runners.",
                  },
                  {
                    icon: FiShield,
                    title: "Runner isolation",
                    description:
                      "A runner belongs to your workspace and is not shared with other workspaces.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-4 rounded-xl border border-white/[0.07] bg-white/[0.015] p-5"
                  >
                    <item.icon className="mt-0.5 size-4 text-white/30" />

                    <div>
                      <p className="text-xs font-medium text-white/55">
                        {item.title}
                      </p>

                      <p className="mt-1.5 text-[11px] leading-5 text-white/25">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom navigation */}

            <div className="mt-24 flex items-center justify-between border-t border-white/[0.07] pt-8">
              <button className="group text-left">
                <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-white/15">
                  <FiArrowLeft className="size-3" />
                  Previous
                </p>

                <p className="mt-2 text-xs text-white/30 group-hover:text-white/60">
                  Documentation
                </p>
              </button>

              <button className="group text-right">
                <p className="flex items-center justify-end gap-2 font-mono text-[9px] uppercase tracking-wider text-white/15">
                  Next
                  <FiArrowRight className="size-3" />
                </p>

                <p className="mt-2 text-xs text-white/30 group-hover:text-white/60">
                  Quickstart
                </p>
              </button>
            </div>

            {/* Footer */}

            <footer className="mt-16 border-t border-white/[0.06] pt-8 pb-12">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] text-white/15">
                  © 2026. All rights reserved.
                </p>

                <div className="flex gap-5 text-[10px] text-white/20">
                  <a href="#" className="hover:text-white/50">
                    Privacy
                  </a>

                  <a href="#" className="hover:text-white/50">
                    Terms
                  </a>

                  <a href="#" className="hover:text-white/50">
                    Support
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </article>
      </div>
    </main>
  );
}
