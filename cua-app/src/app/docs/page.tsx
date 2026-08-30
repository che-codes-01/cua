"use client";

import {
  FiActivity,
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiBox,
  FiGithub,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiCircle,
  FiCode,
  FiCommand,
  FiCopy,
  FiCpu,
  FiDatabase,
  FiExternalLink,
  FiGlobe,
  FiKey,
  FiLayers,
  FiMenu,
  FiMessageSquare,
  FiMonitor,
  FiMousePointer,
  FiPlay,
  FiPlus,
  FiSearch,
  FiServer,
  FiSettings,
  FiShield,
  FiTerminal,
  FiUsers,
  FiWifi,
  FiX,
  FiZap,
} from "react-icons/fi";
import { RiNpmjsLine } from "react-icons/ri";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import Logo from "@/components/custom/Logo";

const sections = [
  {
    title: "GETTING STARTED",
    items: [
      { label: "Introduction", active: true },
      { label: "Quickstart" },
      { label: "Architecture" },
      { label: "Concepts" },
    ],
  },
  {
    title: "RUNNERS",
    items: [
      { label: "Install a Runner" },
      { label: "Runner Configuration" },
      { label: "Runner Lifecycle" },
      { label: "Runner Security" },
    ],
  },
  {
    title: "COMPUTER USE",
    items: [
      { label: "Sessions" },
      { label: "Actions" },
      { label: "Screenshots" },
      { label: "Action Results" },
    ],
  },
  {
    title: "API REFERENCE",
    items: [
      { label: "Authentication" },
      { label: "Runners API" },
      { label: "Sessions API" },
      { label: "Admin API" },
    ],
  },
  {
    title: "INTEGRATIONS",
    items: [
      { label: "n8n" },
      { label: "REST API" },
      { label: "SDK" },
      { label: "WebSocket" },
    ],
  },
];

const endpointGroups = [
  {
    title: "Authentication",
    icon: FiKey,
    endpoints: [
      ["POST", "/auth/login", "Authenticate a user"],
      ["POST", "/auth/register", "Create a tenant user"],
      ["GET", "/auth/me", "Get current user"],
    ],
  },
  {
    title: "Runners",
    icon: FiMonitor,
    endpoints: [
      ["GET", "/api/runners", "List available runners"],
      ["GET", "/api/runners/:id", "Get runner details"],
    ],
  },
  {
    title: "Sessions",
    icon: FiActivity,
    endpoints: [
      ["POST", "/api/sessions", "Open a runner session"],
      ["GET", "/api/sessions", "List your sessions"],
      ["GET", "/api/sessions/:id", "Get session details"],
      ["POST", "/api/sessions/:id/actions", "Execute an action"],
      ["DELETE", "/api/sessions/:id", "Close a session"],
    ],
  },
];

const actions = [
  {
    type: "echo",
    description: "Return a message from the runner.",
    payload: `{
  "type": "echo",
  "message": "hello"
}`,
  },
  {
    type: "info",
    description: "Return machine and runtime information.",
    payload: `{
  "type": "info"
}`,
  },
  {
    type: "shell",
    description: "Execute a command on the runner.",
    payload: `{
  "type": "shell",
  "command": "hostname"
}`,
  },
];

function CodeBlock({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0b0c]">
      {title && (
        <div className="flex h-9 items-center border-b border-white/[0.06] px-4">
          <span className="font-mono text-[10px] text-white/25">{title}</span>
        </div>
      )}

      <div className="relative">
        <button className="absolute right-3 top-3 rounded-md border border-white/[0.07] bg-white/[0.025] p-2 text-white/20 transition hover:text-white/50">
          <FiCopy className="size-3" />
        </button>

        <pre className="overflow-x-auto p-5 pr-14 font-mono text-[11px] leading-6 text-white/45">
          {children}
        </pre>
      </div>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const styles: Record<string, string> = {
    GET: "text-emerald-400/70 bg-emerald-400/[0.06] border-emerald-400/10",
    POST: "text-blue-300/70 bg-blue-400/[0.06] border-blue-400/10",
    DELETE: "text-red-300/60 bg-red-400/[0.05] border-red-400/10",
    PUT: "text-yellow-300/60 bg-yellow-400/[0.05] border-yellow-400/10",
  };

  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${
        styles[method] || "text-white/40 border-white/10"
      }`}
    >
      {method}
    </span>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] lg:block">
      <div className="sticky top-20 h-[calc(100vh-80px)] overflow-y-auto px-6 py-8">
        <div className="mb-7">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
            <FiSearch className="size-3 text-white/25" />

            <span className="text-xs text-white/25">Search docs</span>

            <kbd className="ml-auto rounded border border-white/[0.07] px-1.5 py-0.5 font-mono text-[8px] text-white/15">
              ⌘K
            </kbd>
          </div>
        </div>

        <nav className="space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-3 px-3 font-mono text-[9px] font-medium tracking-[0.18em] text-white/20">
                {section.title}
              </p>

              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <a
                    key={item.label}
                    href="#"
                    className={`group flex items-center rounded-md px-3 py-2 text-[12px] transition ${
                      item.active
                        ? "bg-white/[0.06] text-white/75"
                        : "text-white/30 hover:bg-white/[0.03] hover:text-white/55"
                    }`}
                  >
                    {item.active && (
                      <span className="mr-2 size-1 rounded-full bg-white/70" />
                    )}

                    {item.label}

                    {!item.active && (
                      <FiChevronRight className="ml-auto size-3 opacity-0 transition group-hover:opacity-40" />
                    )}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-10 border-t border-white/[0.06] pt-6">
          <a
            href="#"
            className="flex items-center gap-3 px-3 text-[11px] text-white/25 hover:text-white/50"
          >
            <FiGithub className="size-3.5" />
            GitHub
            <FiExternalLink className="ml-auto size-3" />
          </a>

          <a
            href="#"
            className="mt-4 flex items-center gap-3 px-3 text-[11px] text-white/25 hover:text-white/50"
          >
            <FiActivity className="size-3.5" />
            System status
            <FiExternalLink className="ml-auto size-3" />
          </a>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="sticky top-0 z-50 h-20 border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1500px] items-center px-6 lg:px-8">
        <div className="flex items-center gap-4 lg:w-64">
          <Logo />

          <div className="hidden h-5 w-px bg-white/[0.08] lg:block" />

          <span className="hidden font-mono text-[10px] text-white/20 lg:block">
            DOCS
          </span>
        </div>

        <div className="flex flex-1 items-center justify-between">
          <div className="hidden items-center gap-7 text-[12px] text-white/30 md:flex">
            <a href="#" className="hover:text-white/70">
              Documentation
            </a>

            <a href="#" className="hover:text-white/70">
              API Reference
            </a>

            <a href="#" className="hover:text-white/70">
              Changelog
            </a>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="hidden text-white/30 hover:bg-white/[0.04] hover:text-white/70 sm:flex"
            >
              <FiGithub className="mr-2 size-3.5" />
              GitHub
            </Button>

            <Button
              size="sm"
              className="hidden bg-white text-black hover:bg-white/90 sm:flex"
            >
              Dashboard
              <FiArrowRight className="ml-2 size-3" />
            </Button>

            <button className="rounded-md p-2 text-white/30 lg:hidden">
              <FiMenu className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
      <div className="border-b border-white/[0.06] px-5 py-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
          System architecture
        </span>
      </div>

      <div className="relative p-6 sm:p-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex size-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025]">
              <FiMonitor className="size-4 text-white/45" />
            </div>

            <p className="mt-4 text-xs font-medium text-white/60">User</p>

            <p className="mt-1 text-[10px] leading-5 text-white/20">
              Browser, dashboard, agent
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.1] bg-white/[0.035] p-5">
            <div className="flex size-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
              <FiServer className="size-4 text-white/60" />
            </div>

            <p className="mt-4 text-xs font-medium text-white/70">
              Actions Service
            </p>

            <p className="mt-1 text-[10px] leading-5 text-white/25">
              Auth · sessions · routing
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex size-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025]">
              <FiCpu className="size-4 text-white/45" />
            </div>

            <p className="mt-4 text-xs font-medium text-white/60">Runner</p>

            <p className="mt-1 text-[10px] leading-5 text-white/20">
              Customer machine
            </p>
          </div>
        </div>

        <div className="my-4 hidden items-center justify-center sm:flex">
          <div className="h-px w-[28%] bg-white/[0.08]" />

          <FiChevronRight className="mx-3 size-3 text-white/20" />

          <div className="h-px w-[28%] bg-white/[0.08]" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] p-4 text-center">
            <p className="font-mono text-[9px] text-white/20">REST / HTTPS</p>
          </div>

          <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] p-4 text-center">
            <p className="font-mono text-[9px] text-white/20">WEBSOCKET</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Quickstart() {
  return (
    <section id="quickstart" className="mt-20 scroll-mt-28">
      <div className="mb-7 flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
          <FiPlay className="size-3.5 text-white/50" />
        </div>

        <h2 className="text-2xl font-semibold tracking-tight">Quickstart</h2>
      </div>

      <p className="text-sm leading-7 text-white/35">
        Get the Actions Service running locally, connect a machine as a runner,
        and execute your first computer action.
      </p>

      <div className="mt-8 space-y-3">
        {[
          ["01", "Install the service", "npm install"],
          ["02", "Start the service", "npm run dev"],
          ["03", "Connect a runner", "npm run dev"],
          ["04", "Create a session", "POST /api/sessions"],
        ].map(([number, title, command]) => (
          <div
            key={number}
            className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.015] p-4"
          >
            <span className="font-mono text-[9px] text-white/15">{number}</span>

            <div className="flex-1">
              <p className="text-xs text-white/60">{title}</p>

              <p className="mt-1 font-mono text-[10px] text-white/20">
                {command}
              </p>
            </div>

            <FiChevronRight className="size-3 text-white/15" />
          </div>
        ))}
      </div>

      <CodeBlock title="terminal">
        {`# Computer Actions Service
cd computer-actions-service
npm install
npm run dev

# Runner
cd runner
npm install
npm run dev`}
      </CodeBlock>
    </section>
  );
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-white selection:bg-white/20">
      <Topbar />

      <div className="mx-auto flex max-w-[1500px]">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-4xl px-6 py-12 lg:px-12 lg:py-16 xl:px-20">
            {/* Breadcrumb */}

            <div className="mb-8 flex items-center gap-2 font-mono text-[10px] text-white/20">
              <span>Docs</span>
              <FiChevronRight className="size-3" />
              <span className="text-white/40">Getting Started</span>
            </div>

            {/* Header */}

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className="border-white/[0.08] bg-white/[0.02] font-mono text-[9px] font-normal text-white/30"
                >
                  v0.1
                </Badge>

                <span className="font-mono text-[10px] text-emerald-400/60">
                  ● operational
                </span>
              </div>

              <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Computer Actions
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/35">
                Infrastructure for giving AI agents access to real computers.
                Connect customer-owned machines as runners and execute computer
                actions through a central service.
              </p>
            </div>

            {/* Callout */}

            <div className="mt-10 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiZap className="size-3.5 text-white/50" />
                </div>

                <div>
                  <p className="text-xs font-medium text-white/65">
                    What this provides
                  </p>

                  <p className="mt-2 text-xs leading-6 text-white/30">
                    A relay layer between your applications and machines running
                    your custom computer-use driver. The service manages
                    authentication, tenants, runners, sessions, and action
                    delivery.
                  </p>
                </div>
              </div>
            </div>

            {/* Architecture */}

            <section id="architecture" className="mt-20 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiLayers className="size-3.5 text-white/50" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Architecture
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                The system consists of three primary components: the application
                or employee client, the central Actions Service, and one or more
                customer-owned runners.
              </p>

              <ArchitectureDiagram />

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: FiUsers,
                    title: "Tenant",
                    text: "Owns runners and users.",
                  },
                  {
                    icon: FiServer,
                    title: "Actions Service",
                    text: "Authenticates and routes actions.",
                  },
                  {
                    icon: FiCpu,
                    title: "Runner",
                    text: "Executes actions locally.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <Card
                      key={item.title}
                      className="border-white/[0.07] bg-white/[0.015] p-5"
                    >
                      <Icon className="size-4 text-white/30" />

                      <p className="mt-4 text-xs font-medium text-white/55">
                        {item.title}
                      </p>

                      <p className="mt-2 text-[11px] leading-5 text-white/20">
                        {item.text}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Quickstart */}

            <Quickstart />

            {/* Runners */}

            <section className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiCpu className="size-3.5 text-white/50" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Runners
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                A runner is a lightweight agent installed on a customer machine.
                It maintains a WebSocket connection to the Actions Service and
                waits for work.
              </p>

              <CodeBlock title=".env">
                {`COMPUTER_ACTIONS_SERVICE_URL=ws://localhost:3000
COMPUTER_ACTIONS_SERVICE_API_KEY=<tenant-api-key>

RUNNER_NAME=my-macbook
RUNNER_LABELS=macos,arm64`}
              </CodeBlock>

              <div className="my-8 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: FiWifi,
                    title: "Persistent connection",
                    text: "The runner maintains a WebSocket connection and reconnects automatically.",
                  },
                  {
                    icon: FiShield,
                    title: "Tenant isolation",
                    text: "A runner belongs to exactly one tenant and cannot be accessed by another tenant.",
                  },
                  {
                    icon: FiActivity,
                    title: "Heartbeat",
                    text: "Regular heartbeats allow the service to determine runner availability.",
                  },
                  {
                    icon: FiSettings,
                    title: "Labels",
                    text: "Attach labels such as macos, arm64, chrome, or production for routing.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-5"
                    >
                      <Icon className="size-4 text-white/35" />

                      <p className="mt-4 text-xs font-medium text-white/55">
                        {item.title}
                      </p>

                      <p className="mt-2 text-[11px] leading-5 text-white/20">
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Sessions */}

            <section className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiCommand className="size-3.5 text-white/50" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Sessions
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                A session represents an active connection between a user and a
                runner. Actions dispatched during the session are routed
                exclusively to that runner.
              </p>

              <CodeBlock title="create-session.sh">
                {`curl -X POST http://localhost:3000/api/sessions \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "runnerId": "runner_8f3a2"
  }'`}
              </CodeBlock>

              <div className="overflow-hidden rounded-xl border border-white/[0.08]">
                <div className="grid grid-cols-4 border-b border-white/[0.06] bg-white/[0.025] px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-white/20">
                  <span>State</span>
                  <span>Meaning</span>
                  <span>Runner</span>
                  <span>Actions</span>
                </div>

                {[
                  ["pending", "Waiting for runner", "—", "Blocked"],
                  ["active", "Session accepted", "Connected", "Allowed"],
                  ["closed", "Session ended", "Released", "Blocked"],
                ].map(([state, meaning, runner, action]) => (
                  <div
                    key={state}
                    className="grid grid-cols-4 border-b border-white/[0.05] px-4 py-4 last:border-0"
                  >
                    <span className="font-mono text-[10px] text-white/40">
                      {state}
                    </span>

                    <span className="text-[10px] text-white/25">{meaning}</span>

                    <span className="text-[10px] text-white/25">{runner}</span>

                    <span className="text-[10px] text-white/25">{action}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Actions */}

            <section className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiMousePointer className="size-3.5 text-white/50" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Actions
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                Actions are JSON messages sent to the runner. The payload is
                intentionally flexible so your custom computer-use driver can
                define its own action schema.
              </p>

              <div className="mt-8 space-y-3">
                {actions.map((action) => (
                  <Card
                    key={action.type}
                    className="overflow-hidden border-white/[0.07] bg-white/[0.015] p-0"
                  >
                    <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
                      <span className="rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[10px] text-white/55">
                        {action.type}
                      </span>

                      <p className="text-xs text-white/30">
                        {action.description}
                      </p>
                    </div>

                    <pre className="overflow-x-auto p-5 font-mono text-[10px] leading-6 text-white/30">
                      {action.payload}
                    </pre>
                  </Card>
                ))}
              </div>
            </section>

            {/* API */}

            <section className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiCode className="size-3.5 text-white/50" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  API reference
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                The HTTP API is the primary interface for applications,
                dashboards, AI agents, and workflow systems.
              </p>

              <div className="mt-8 space-y-4">
                {endpointGroups.map((group) => {
                  const Icon = group.icon;

                  return (
                    <Card
                      key={group.title}
                      className="overflow-hidden border-white/[0.07] bg-white/[0.015] p-0"
                    >
                      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
                        <Icon className="size-3.5 text-white/30" />

                        <span className="text-xs font-medium text-white/55">
                          {group.title}
                        </span>
                      </div>

                      <div>
                        {group.endpoints.map(([method, path, description]) => (
                          <div
                            key={`${method}-${path}`}
                            className="group flex items-center gap-4 border-b border-white/[0.04] px-5 py-4 last:border-0 hover:bg-white/[0.02]"
                          >
                            <MethodBadge method={method} />

                            <code className="font-mono text-[10px] text-white/45">
                              {path}
                            </code>

                            <span className="ml-auto hidden text-[10px] text-white/20 sm:block">
                              {description}
                            </span>

                            <FiChevronRight className="size-3 text-white/10" />
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* WebSocket */}

            <section className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiWifi className="size-3.5 text-white/50" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Runner WebSocket
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                Runners connect to the service over WebSocket. Authentication is
                performed using the tenant runner API key.
              </p>

              <CodeBlock title="connection">
                {`ws://localhost:3000/runner/ws

Authorization:
  apiKey: <tenant-api-key>`}
              </CodeBlock>

              <div className="overflow-hidden rounded-xl border border-white/[0.08]">
                <div className="grid grid-cols-2 border-b border-white/[0.06] bg-white/[0.025] px-5 py-3 font-mono text-[9px] uppercase tracking-wider text-white/20">
                  <span>Runner → Service</span>
                  <span>Service → Runner</span>
                </div>

                <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                  <div className="space-y-1 p-5">
                    {[
                      "register",
                      "heartbeat",
                      "session_accepted",
                      "session_rejected",
                      "session_closed",
                      "action_result",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-md px-3 py-2 font-mono text-[10px] text-white/30 hover:bg-white/[0.025]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 p-5">
                    {[
                      "connected",
                      "registered",
                      "pong",
                      "session_request",
                      "action",
                      "close_session",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-md px-3 py-2 font-mono text-[10px] text-white/30 hover:bg-white/[0.025]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* n8n */}

            <section className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiCommand className="size-3.5 text-white/50" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  n8n integration
                </h2>
              </div>

              <p className="text-sm leading-7 text-white/35">
                Computer actions can be exposed as an n8n node, allowing AI
                Agent workflows to discover runners, create sessions, and
                execute actions on customer machines.
              </p>

              <div className="my-8 rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                    <FiServer className="size-4 text-white/45" />
                  </div>

                  <FiArrowRight className="size-4 text-white/15" />

                  <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                    <FiCommand className="size-4 text-white/45" />
                  </div>

                  <FiArrowRight className="size-4 text-white/15" />

                  <div className="flex size-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                    <FiCpu className="size-4 text-white/45" />
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 font-mono text-[9px] text-white/20">
                  <span>Actions Service</span>
                  <span>→</span>
                  <span>n8n Agent Tool</span>
                  <span>→</span>
                  <span>Customer Runner</span>
                </div>
              </div>

              <CodeBlock title="n8n tool input">
                {`{
  "runnerId": "runner_8f3a2",
  "action": {
    "type": "screenshot"
  }
}`}
              </CodeBlock>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-5">
                <div className="flex items-center gap-3">
                  <FiCheck className="size-4 text-emerald-400/60" />

                  <p className="text-xs text-white/55">
                    The node only needs to understand the Actions Service API.
                  </p>
                </div>

                <p className="mt-3 pl-7 text-[11px] leading-5 text-white/20">
                  The underlying computer-use implementation remains inside your
                  runner. This keeps the workflow layer independent from the
                  machine-control implementation.
                </p>
              </div>
            </section>

            {/* Security */}

            <section className="mt-24 scroll-mt-28">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
                  <FiShield className="size-3.5 text-white/50" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Security model
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  [
                    FiUsers,
                    "Tenant isolation",
                    "Users can only see runners belonging to their tenant.",
                  ],
                  [
                    FiKey,
                    "Runner API keys",
                    "Each tenant receives a dedicated credential for its runners.",
                  ],
                  [
                    FiShield,
                    "User JWT",
                    "Application requests are authenticated using tenant-scoped JWTs.",
                  ],
                  [
                    FiWifi,
                    "Outbound runner connection",
                    "Runners establish the connection to the service instead of exposing inbound ports.",
                  ],
                ].map(([icon, title, description]) => {
                  const Icon = icon as typeof FiShield;

                  return (
                    <Card
                      key={title as string}
                      className="border-white/[0.07] bg-white/[0.015] p-5"
                    >
                      <Icon className="size-4 text-white/35" />

                      <p className="mt-4 text-xs font-medium text-white/55">
                        {title as string}
                      </p>

                      <p className="mt-2 text-[11px] leading-5 text-white/20">
                        {description as string}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Footer navigation */}

            <div className="mt-24 flex items-center justify-between border-t border-white/[0.07] pt-8">
              <button className="group text-left">
                <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-white/15">
                  <FiArrowLeft className="size-3" />
                  Previous
                </p>

                <p className="mt-2 text-xs text-white/30 group-hover:text-white/60">
                  Introduction
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
          </div>
        </div>
      </div>
    </main>
  );
}
