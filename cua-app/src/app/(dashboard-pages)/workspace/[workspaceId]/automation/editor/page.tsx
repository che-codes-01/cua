"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiCheck,
  FiChevronDown,
  FiCopy,
  FiLink,
  FiMonitor,
  FiMousePointer,
  FiPlay,
  FiPlus,
  FiSave,
  FiSettings,
  FiTrash2,
  FiType,
  FiX,
  FiZap,
  FiGlobe,
  FiCpu,
  FiLock,
} from "react-icons/fi";

import { Button } from "@/components/ui/button";

// ============ Tool Definitions ============

type ToolParam = {
  name: string;
  type: "number" | "string" | "select" | "coordinate";
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  default?: string | number;
};

type ToolDefinition = {
  type: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: "trigger" | "mouse" | "keyboard" | "screen" | "utility";
  color: string;
  params: ToolParam[];
};

const TOOLS: ToolDefinition[] = [
  // Trigger
  {
    type: "webhook_trigger",
    name: "Webhook Trigger",
    description: "Start workflow via HTTP request",
    icon: FiGlobe,
    category: "trigger",
    color: "bg-purple-500",
    params: [],
  },

  // Mouse actions
  {
    type: "left_click",
    name: "Left Click",
    description: "Click at a coordinate",
    icon: FiMousePointer,
    category: "mouse",
    color: "bg-blue-500",
    params: [
      { name: "coordinate", type: "coordinate", label: "Position (x, y)", required: true },
    ],
  },
  {
    type: "double_click",
    name: "Double Click",
    description: "Double-click at a coordinate",
    icon: FiMousePointer,
    category: "mouse",
    color: "bg-blue-500",
    params: [
      { name: "coordinate", type: "coordinate", label: "Position (x, y)", required: true },
    ],
  },
  {
    type: "right_click",
    name: "Right Click",
    description: "Right-click at a coordinate",
    icon: FiMousePointer,
    category: "mouse",
    color: "bg-blue-500",
    params: [
      { name: "coordinate", type: "coordinate", label: "Position (x, y)", required: true },
    ],
  },
  {
    type: "mouse_move",
    name: "Mouse Move",
    description: "Move mouse to a coordinate",
    icon: FiMousePointer,
    category: "mouse",
    color: "bg-blue-500",
    params: [
      { name: "coordinate", type: "coordinate", label: "Position (x, y)", required: true },
    ],
  },
  {
    type: "left_click_drag",
    name: "Click & Drag",
    description: "Drag from one point to another",
    icon: FiMousePointer,
    category: "mouse",
    color: "bg-blue-500",
    params: [
      { name: "start_coordinate", type: "coordinate", label: "Start (x, y)", required: true },
      { name: "coordinate", type: "coordinate", label: "End (x, y)", required: true },
    ],
  },
  {
    type: "scroll",
    name: "Scroll",
    description: "Scroll in a direction",
    icon: FiMousePointer,
    category: "mouse",
    color: "bg-blue-500",
    params: [
      { name: "coordinate", type: "coordinate", label: "Position (x, y)" },
      {
        name: "scroll_direction",
        type: "select",
        label: "Direction",
        required: true,
        options: [
          { value: "up", label: "Up" },
          { value: "down", label: "Down" },
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
      },
      { name: "scroll_amount", type: "number", label: "Amount", required: true, default: 3 },
    ],
  },
  {
    type: "click_text",
    name: "Click Text",
    description: "Find and click on text",
    icon: FiMousePointer,
    category: "mouse",
    color: "bg-blue-500",
    params: [
      { name: "text", type: "string", label: "Text to find", required: true, placeholder: "Button text..." },
      {
        name: "button",
        type: "select",
        label: "Click type",
        options: [
          { value: "left", label: "Left click" },
          { value: "right", label: "Right click" },
          { value: "double", label: "Double click" },
        ],
        default: "left",
      },
    ],
  },

  // Keyboard actions
  {
    type: "type",
    name: "Type Text",
    description: "Type text using keyboard",
    icon: FiType,
    category: "keyboard",
    color: "bg-green-500",
    params: [
      { name: "text", type: "string", label: "Text to type", required: true, placeholder: "Hello world..." },
    ],
  },
  {
    type: "key",
    name: "Press Key",
    description: "Press a key or key combination",
    icon: FiType,
    category: "keyboard",
    color: "bg-green-500",
    params: [
      { name: "text", type: "string", label: "Key(s)", required: true, placeholder: "cmd+c, enter, tab..." },
    ],
  },

  // Screen actions
  {
    type: "screenshot",
    name: "Screenshot",
    description: "Capture the screen",
    icon: FiMonitor,
    category: "screen",
    color: "bg-orange-500",
    params: [],
  },
  {
    type: "find_text",
    name: "Find Text",
    description: "Find text on screen",
    icon: FiMonitor,
    category: "screen",
    color: "bg-orange-500",
    params: [
      { name: "text", type: "string", label: "Text to find", required: true, placeholder: "Search text..." },
    ],
  },

  // Utility actions
  {
    type: "wait",
    name: "Wait",
    description: "Pause for a duration",
    icon: FiZap,
    category: "utility",
    color: "bg-yellow-500",
    params: [
      { name: "duration", type: "number", label: "Seconds", required: true, default: 1 },
    ],
  },
  {
    type: "shell",
    name: "Run Command",
    description: "Execute a shell command",
    icon: FiZap,
    category: "utility",
    color: "bg-yellow-500",
    params: [
      { name: "command", type: "string", label: "Command", required: true, placeholder: "ls -la" },
    ],
  },
];

// ============ Types ============

type WorkflowNode = {
  id: string;
  type: string;
  name?: string; // Custom step name
  position: { x: number; y: number };
  params: Record<string, unknown>;
};

type Workflow = {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  published: boolean;
  webhookKey?: string;
  runnerId?: string;
};

type Runner = {
  id: string;
  name: string;
  status: "online" | "offline" | "busy";
};

// ============ Main Component ============

export default function WorkflowEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const canvasRef = useRef<HTMLDivElement>(null);

  const workflowId = searchParams.get("id");
  const workspaceId = params.workspaceId as string;

  // Workflow state
  const [workflow, setWorkflow] = useState<Workflow>({
    id: crypto.randomUUID(),
    name: "Untitled Workflow",
    nodes: [
      {
        id: "trigger-1",
        type: "webhook_trigger",
        position: { x: 100, y: 200 },
        params: {},
      },
    ],
    published: false,
  });

  const [isLoading, setIsLoading] = useState(!!workflowId);

  // UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [toolsMenuPosition, setToolsMenuPosition] = useState({ x: 0, y: 0 });
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [selectedRunnerId, setSelectedRunnerId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [loadingRunners, setLoadingRunners] = useState(false);

  // Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const selectedNode = workflow.nodes.find((n) => n.id === selectedNodeId);
  const selectedTool = selectedNode ? TOOLS.find((t) => t.type === selectedNode.type) : null;

  // Load existing workflow if editing
  useEffect(() => {
    if (!workflowId) {
      setIsLoading(false);
      return;
    }

    async function loadWorkflow() {
      try {
        const res = await fetch(`/api/workflows/get?id=${workflowId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.workflow) {
            setWorkflow({
              id: data.workflow.id,
              name: data.workflow.name,
              nodes: data.workflow.nodes || [],
              published: data.workflow.published,
              webhookKey: data.workflow.webhook_key_hash ? "(hidden)" : undefined,
              runnerId: data.workflow.runner_id,
            });
            if (data.workflow.runner_id) {
              setSelectedRunnerId(data.workflow.runner_id);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkflow();
  }, [workflowId]);

  // Handle canvas click to add node
  function handleCanvasClick(e: React.MouseEvent) {
    if (e.target === canvasRef.current) {
      setSelectedNodeId(null);
    }
  }

  // Handle canvas right-click to show tools menu
  function handleCanvasContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setToolsMenuPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setShowToolsMenu(true);
    }
  }

  // Add a new node
  function addNode(toolType: string) {
    const tool = TOOLS.find((t) => t.type === toolType);
    if (!tool) return;

    const defaultParams: Record<string, unknown> = {};
    tool.params.forEach((p) => {
      if (p.default !== undefined) {
        defaultParams[p.name] = p.default;
      } else if (p.type === "coordinate") {
        defaultParams[p.name] = [0, 0];
      }
    });

    // Position new node after the last one
    const lastNode = workflow.nodes[workflow.nodes.length - 1];
    const newPosition = lastNode
      ? { x: lastNode.position.x + 200, y: lastNode.position.y }
      : { x: toolsMenuPosition.x, y: toolsMenuPosition.y };

    const newNode: WorkflowNode = {
      id: crypto.randomUUID(),
      type: toolType,
      position: newPosition,
      params: defaultParams,
    };

    setWorkflow((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    setSelectedNodeId(newNode.id);
    setShowToolsMenu(false);
  }

  // Update node params
  function updateNode(nodeId: string, params: Record<string, unknown>) {
    setWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId ? { ...n, params: { ...n.params, ...params } } : n
      ),
    }));
  }

  // Update node name
  function updateNodeName(nodeId: string, name: string) {
    setWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId ? { ...n, name: name || undefined } : n
      ),
    }));
  }

  // Delete node
  function deleteNode(nodeId: string) {
    // Don't delete the trigger
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (node?.type === "webhook_trigger") return;

    setWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
    }));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }

  // Handle node drag
  function handleNodeMouseDown(e: React.MouseEvent, nodeId: string) {
    e.stopPropagation();
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y,
    });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!draggingNodeId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === draggingNodeId
          ? {
              ...n,
              position: {
                x: Math.max(0, e.clientX - rect.left - dragOffset.x + rect.left),
                y: Math.max(0, e.clientY - rect.top - dragOffset.y + rect.top),
              },
            }
          : n
      ),
    }));
  }

  function handleMouseUp() {
    setDraggingNodeId(null);
  }

  // Open publish modal and fetch live runners
  async function openPublishModal() {
    setShowPublishModal(true);
    setLoadingRunners(true);
    
    try {
      if (workspaceId) {
        // Fetch live connected runners
        const res = await fetch(`/api/runners/live?workspaceId=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setRunners(data.runners || []);
        }
      }
    } catch (e) {
      console.error("Failed to fetch runners:", e);
    } finally {
      setLoadingRunners(false);
    }
  }

  // Publish workflow
  async function publishWorkflow() {
    if (!selectedRunnerId) return;

    setIsPublishing(true);
    try {
      const res = await fetch("/api/workflows/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: {
            ...workflow,
            runnerId: selectedRunnerId,
          },
          workspaceId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWorkflow((prev) => ({
          ...prev,
          published: true,
          webhookKey: data.webhookKey,
          runnerId: selectedRunnerId,
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPublishing(false);
    }
  }

  // Save workflow
  async function saveWorkflow() {
    if (!workspaceId) {
      console.error("No workspaceId available");
      return;
    }
    
    setIsSaving(true);
    try {
      console.log("Saving workflow with workspaceId:", workspaceId);
      const res = await fetch("/api/workflows/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow, workspaceId }),
      });
      
      if (res.ok) {
        // Update URL to include workflow ID if not already there
        if (!workflowId) {
          router.replace(`/workspace/${workspaceId}/automation/editor?id=${workflow.id}`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }

  // Copy webhook URL
  async function copyWebhookUrl() {
    const url = `${window.location.origin}/api/workflows/trigger/${workflow.id}`;
    await navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  }

  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/workflows/trigger/${workflow.id}`;

  if (isLoading) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-white/30">Loading workflow...</div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/workspace/${workspaceId}/automation`)}
            className="flex items-center gap-2 text-white/40 hover:text-white"
          >
            <FiArrowLeft className="size-4" />
          </button>
          <div className="h-5 w-px bg-white/[0.06]" />
          <input
            type="text"
            value={workflow.name}
            onChange={(e) => setWorkflow((prev) => ({ ...prev, name: e.target.value }))}
            className="bg-transparent text-sm font-medium text-white/80 outline-none"
          />
          {workflow.published && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">
              Published
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={saveWorkflow}
            disabled={isSaving}
            className="h-8 border-white/[0.08] px-3 text-xs text-white/50 hover:bg-white/[0.04] hover:text-white"
          >
            <FiSave className="mr-2 size-3.5" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            onClick={openPublishModal}
            className="h-8 bg-emerald-500 px-4 text-xs text-white hover:bg-emerald-600"
          >
            <FiGlobe className="mr-2 size-3.5" />
            Publish
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative flex-1 overflow-hidden bg-[#080808]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
          onClick={handleCanvasClick}
          onContextMenu={handleCanvasContextMenu}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Connection lines */}
          <svg className="pointer-events-none absolute inset-0 size-full">
            {workflow.nodes.slice(1).map((node, index) => {
              const prevNode = workflow.nodes[index];
              if (!prevNode) return null;
              
              const startX = prevNode.position.x + 140;
              const startY = prevNode.position.y + 40;
              const endX = node.position.x;
              const endY = node.position.y + 40;
              const midX = (startX + endX) / 2;

              return (
                <path
                  key={`line-${node.id}`}
                  d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {workflow.nodes.map((node, index) => {
            const tool = TOOLS.find((t) => t.type === node.type);
            if (!tool) return null;

            return (
              <div
                key={node.id}
                className={`absolute cursor-move select-none ${
                  selectedNodeId === node.id ? "z-10" : ""
                }`}
                style={{ left: node.position.x, top: node.position.y }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(node.id);
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              >
                <div
                  className={`w-[140px] rounded-xl border transition ${
                    selectedNodeId === node.id
                      ? "border-white/30 shadow-lg shadow-white/5"
                      : "border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  {/* Node header */}
                  <div className={`flex items-center gap-2 rounded-t-xl px-3 py-2 ${tool.color}`}>
                    <tool.icon className="size-3.5 text-white" />
                    <span className="truncate text-[10px] font-medium text-white">
                      {node.name || tool.name}
                    </span>
                  </div>
                  
                  {/* Node body */}
                  <div className="rounded-b-xl bg-[#111] px-3 py-2">
                    <p className="text-[9px] text-white/30">
                      {node.name && node.name !== tool.name ? tool.name : 
                        tool.params.length > 0
                          ? `${tool.params.length} parameter${tool.params.length > 1 ? "s" : ""}`
                          : tool.type === "webhook_trigger"
                          ? "HTTP POST trigger"
                          : "No parameters"}
                    </p>
                  </div>

                  {/* Connection points */}
                  {node.type !== "webhook_trigger" && (
                    <div className="absolute -left-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-white/20 bg-[#111]" />
                  )}
                  <div className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-white/20 bg-[#111]" />
                </div>

                {/* Step number */}
                <div className="absolute -left-6 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.06] text-[9px] text-white/40">
                  {index + 1}
                </div>
              </div>
            );
          })}

          {/* Tools menu */}
          {showToolsMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowToolsMenu(false)}
              />
              <div
                className="absolute z-50 w-[200px] rounded-xl border border-white/[0.08] bg-[#111] py-2 shadow-xl"
                style={{ left: toolsMenuPosition.x, top: toolsMenuPosition.y }}
              >
                <p className="mb-2 px-3 font-mono text-[9px] uppercase tracking-wider text-white/20">
                  Add Node
                </p>
                {["mouse", "keyboard", "screen", "utility"].map((category) => (
                  <div key={category}>
                    <p className="mt-2 px-3 text-[9px] capitalize text-white/30">{category}</p>
                    {TOOLS.filter((t) => t.category === category).map((tool) => (
                      <button
                        key={tool.type}
                        onClick={() => addNode(tool.type)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-white/60 hover:bg-white/[0.04] hover:text-white"
                      >
                        <div className={`rounded p-1 ${tool.color}`}>
                          <tool.icon className="size-3 text-white" />
                        </div>
                        {tool.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Empty state hint */}
          {workflow.nodes.length === 1 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="ml-[200px] rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-4 text-center">
                <p className="text-xs text-white/30">Right-click to add nodes</p>
              </div>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedNode && selectedTool && (
          <aside className="w-[280px] shrink-0 overflow-y-auto border-l border-white/[0.06] bg-[#0a0a0a]">
            <div className="border-b border-white/[0.06] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-2 ${selectedTool.color}`}>
                    <selectedTool.icon className="size-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{selectedTool.name}</p>
                    <p className="text-[10px] text-white/30">{selectedTool.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="text-white/30 hover:text-white"
                >
                  <FiX className="size-4" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Step Name Input */}
              <div className="mb-4">
                <label className="mb-1.5 block text-[10px] text-white/40">Step Name</label>
                <input
                  type="text"
                  value={selectedNode.name || ""}
                  onChange={(e) => updateNodeName(selectedNode.id, e.target.value)}
                  placeholder={selectedTool.name}
                  className="w-full rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs text-white/70 outline-none focus:border-white/20"
                />
              </div>

              {selectedNode.type === "webhook_trigger" ? (
                <div>
                  <p className="mb-3 font-mono text-[9px] uppercase tracking-wider text-white/20">
                    Trigger Settings
                  </p>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[10px] text-white/40">
                      This workflow will be triggered by an HTTP POST request to:
                    </p>
                    <code className="mt-2 block break-all rounded bg-black/30 p-2 font-mono text-[10px] text-white/60">
                      POST /api/workflows/trigger/{workflow.id.slice(0, 8)}...
                    </code>
                    {workflow.webhookKey && (
                      <div className="mt-3 border-t border-white/[0.06] pt-3">
                        <p className="text-[10px] text-white/40">Header required:</p>
                        <code className="mt-1 block rounded bg-black/30 p-2 font-mono text-[10px] text-white/60">
                          x-webhook-key: {workflow.webhookKey.slice(0, 12)}...
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-white/20">
                    Parameters
                  </p>
                  {selectedTool.params.map((param) => (
                    <ParamInput
                      key={param.name}
                      param={param}
                      value={selectedNode.params[param.name]}
                      onChange={(value) => updateNode(selectedNode.id, { [param.name]: value })}
                    />
                  ))}
                  {selectedTool.params.length === 0 && (
                    <p className="text-[10px] text-white/30">No parameters for this action</p>
                  )}
                </div>
              )}

              {selectedNode.type !== "webhook_trigger" && (
                <button
                  onClick={() => deleteNode(selectedNode.id)}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/20 py-2 text-xs text-red-400/60 hover:bg-red-400/10 hover:text-red-400"
                >
                  <FiTrash2 className="size-3.5" />
                  Delete Node
                </button>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/20 p-2">
                  <FiGlobe className="size-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Publish Workflow</h2>
                  <p className="text-xs text-white/40">Generate webhook and select runner</p>
                </div>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                className="text-white/30 hover:text-white"
              >
                <FiX className="size-5" />
              </button>
            </div>

            {workflow.published ? (
              <div className="mt-6">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <FiCheck className="size-4" />
                    <p className="text-sm font-medium">Workflow Published!</p>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-[10px] text-white/40">Webhook URL</p>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 truncate rounded bg-black/30 px-2 py-1.5 font-mono text-[10px] text-white/60">
                          {webhookUrl}
                        </code>
                        <button
                          onClick={copyWebhookUrl}
                          className="rounded bg-white/[0.06] p-1.5 text-white/40 hover:bg-white/[0.1] hover:text-white"
                        >
                          {copiedWebhook ? <FiCheck className="size-3.5 text-emerald-400" /> : <FiCopy className="size-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-white/40">Webhook Key (Header: x-webhook-key)</p>
                      <code className="mt-1 block rounded bg-black/30 px-2 py-1.5 font-mono text-[10px] text-white/60">
                        {workflow.webhookKey || "(Key shown only once after publishing)"}
                      </code>
                    </div>

                    <div>
                      <p className="text-[10px] text-white/40">Runner</p>
                      <p className="mt-1 text-xs text-white/60">
                        {runners.find((r) => r.id === workflow.runnerId)?.name || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                {workflow.webhookKey && workflow.webhookKey !== "(hidden)" && (
                  <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="mb-2 text-[10px] font-medium text-white/50">Example cURL</p>
                    <code className="block whitespace-pre-wrap break-all rounded bg-black/30 p-2 font-mono text-[9px] text-white/50">
{`curl -X POST \\
  ${webhookUrl} \\
  -H "x-webhook-key: ${workflow.webhookKey}" \\
  -H "Content-Type: application/json" \\
  -d '{}'`}
                    </code>
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Allow republishing - reset published state temporarily
                      setWorkflow((prev) => ({ ...prev, published: false }));
                    }}
                    className="h-10 flex-1 border-white/[0.08] text-sm text-white/50 hover:bg-white/[0.04] hover:text-white"
                  >
                    Republish
                  </Button>
                  <Button
                    onClick={() => setShowPublishModal(false)}
                    className="h-10 flex-1 bg-white text-sm text-black hover:bg-white/90"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <div>
                  <label className="mb-2 block text-xs text-white/40">
                    <FiCpu className="mr-1 inline size-3" />
                    Select Runner
                  </label>
                  <div className="space-y-2">
                    {loadingRunners ? (
                      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                        <p className="text-xs text-white/30">Loading runners...</p>
                      </div>
                    ) : runners.filter(r => r.status === "online").length > 0 ? (
                      runners.filter(r => r.status === "online").map((runner) => (
                        <button
                          key={runner.id}
                          onClick={() => setSelectedRunnerId(runner.id)}
                          className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                            selectedRunnerId === runner.id
                              ? "border-emerald-500/50 bg-emerald-500/10"
                              : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <FiCpu className="size-4 text-white/40" />
                              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-emerald-400" />
                            </div>
                            <div>
                              <p className="text-xs text-white/70">{runner.name}</p>
                              <p className="text-[10px] text-emerald-400/60">Connected</p>
                            </div>
                          </div>
                          {selectedRunnerId === runner.id && (
                            <FiCheck className="size-4 text-emerald-400" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                        <FiCpu className="mx-auto size-6 text-white/20" />
                        <p className="mt-2 text-xs text-white/30">No runners connected</p>
                        <p className="mt-1 text-[10px] text-white/20">
                          Start a runner to publish this workflow
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                  <FiLock className="mt-0.5 size-4 shrink-0 text-yellow-500/60" />
                  <p className="text-[10px] text-yellow-500/80">
                    A secure webhook key will be generated. Include it in the <code className="rounded bg-black/20 px-1">x-webhook-key</code> header when triggering this workflow.
                  </p>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowPublishModal(false)}
                    className="h-10 flex-1 border-white/[0.08] text-sm text-white/50 hover:bg-white/[0.04] hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={publishWorkflow}
                    disabled={!selectedRunnerId || isPublishing}
                    className="h-10 flex-1 bg-emerald-500 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {isPublishing ? "Publishing..." : "Publish"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// ============ Helper Components ============

function ParamInput({
  param,
  value,
  onChange,
}: {
  param: ToolParam;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (param.type === "coordinate") {
    const coord = (value as [number, number]) || [0, 0];
    return (
      <div>
        <label className="mb-1.5 block text-[10px] text-white/40">
          {param.label}
          {param.required && <span className="ml-1 text-red-400">*</span>}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={coord[0]}
            onChange={(e) => onChange([parseInt(e.target.value) || 0, coord[1]])}
            placeholder="X"
            className="w-full rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs text-white/70 outline-none focus:border-white/20"
          />
          <input
            type="number"
            value={coord[1]}
            onChange={(e) => onChange([coord[0], parseInt(e.target.value) || 0])}
            placeholder="Y"
            className="w-full rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs text-white/70 outline-none focus:border-white/20"
          />
        </div>
      </div>
    );
  }

  if (param.type === "select") {
    return (
      <div>
        <label className="mb-1.5 block text-[10px] text-white/40">
          {param.label}
          {param.required && <span className="ml-1 text-red-400">*</span>}
        </label>
        <select
          value={(value as string) || param.default || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs text-white/70 outline-none focus:border-white/20"
        >
          <option value="">Select...</option>
          {param.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (param.type === "number") {
    return (
      <div>
        <label className="mb-1.5 block text-[10px] text-white/40">
          {param.label}
          {param.required && <span className="ml-1 text-red-400">*</span>}
        </label>
        <input
          type="number"
          value={(value as number) ?? param.default ?? ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={param.placeholder}
          className="w-full rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs text-white/70 outline-none focus:border-white/20"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-[10px] text-white/40">
        {param.label}
        {param.required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <input
        type="text"
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={param.placeholder}
        className="w-full rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs text-white/70 outline-none focus:border-white/20"
      />
    </div>
  );
}
