"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
  FiArrowLeft, FiCheck, FiCheckCircle, FiCopy, FiGlobe, FiCpu, FiLock,
  FiMonitor, FiMousePointer, FiPlay, FiPlus, FiSave, FiShield, FiTrash2,
  FiType, FiX, FiXCircle, FiZap, FiSearch, FiTerminal, FiMove, FiHelpCircle,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";

// ─── Constants ────────────────────────────────────────────────────────────────
const NODE_W = 240;
const NODE_H = 64; // used for handle vertical centering

// ─── Types ────────────────────────────────────────────────────────────────────
type ToolParam = {
  name: string;
  type: "number" | "string" | "select" | "coordinate";
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  default?: string | number;
};
type ToolDef = {
  type: string; name: string; description: string;
  icon: React.ElementType;
  category: "trigger"|"mouse"|"keyboard"|"screen"|"utility"|"assert";
  color: string; params: ToolParam[];
};
type NodeOutput = {
  success: boolean; text: string; durationMs: number; resultType: string;
};
type WFNode = {
  id: string; type: string; name?: string;
  position: { x: number; y: number };
  params: Record<string, unknown>;
};
type Workflow = {
  id: string; name: string; nodes: WFNode[];
  published: boolean; webhookKey?: string; runnerId?: string;
};
type Runner = { id: string; name: string; status: string };

// ─── Tool catalogue ───────────────────────────────────────────────────────────
const TOOLS: ToolDef[] = [
  { type:"webhook_trigger", name:"Webhook Trigger", description:"HTTP POST entry", icon:FiGlobe, category:"trigger", color:"bg-purple-500", params:[] },
  // mouse
  { type:"left_click",      name:"Left Click",    description:"Click at position",       icon:FiMousePointer, category:"mouse", color:"bg-blue-500",  params:[{name:"coordinate",type:"coordinate",label:"Position (x, y)",required:true}] },
  { type:"double_click",    name:"Double Click",  description:"Double-click",             icon:FiMousePointer, category:"mouse", color:"bg-blue-500",  params:[{name:"coordinate",type:"coordinate",label:"Position (x, y)",required:true}] },
  { type:"right_click",     name:"Right Click",   description:"Right-click",              icon:FiMousePointer, category:"mouse", color:"bg-blue-500",  params:[{name:"coordinate",type:"coordinate",label:"Position (x, y)",required:true}] },
  { type:"mouse_move",      name:"Mouse Move",    description:"Move cursor",              icon:FiMousePointer, category:"mouse", color:"bg-blue-500",  params:[{name:"coordinate",type:"coordinate",label:"Position (x, y)",required:true}] },
  { type:"mouse_down",      name:"Mouse Down",    description:"Hold mouse button",        icon:FiMousePointer, category:"mouse", color:"bg-blue-600",  params:[{name:"coordinate",type:"coordinate",label:"Position",required:true},{name:"button",type:"select",label:"Button",options:[{value:"left",label:"Left"},{value:"right",label:"Right"}],default:"left"}] },
  { type:"mouse_up",        name:"Mouse Up",      description:"Release mouse button",     icon:FiMousePointer, category:"mouse", color:"bg-blue-600",  params:[{name:"coordinate",type:"coordinate",label:"Position",required:true},{name:"button",type:"select",label:"Button",options:[{value:"left",label:"Left"},{value:"right",label:"Right"}],default:"left"}] },
  { type:"left_click_drag", name:"Click & Drag",  description:"Drag A → B",               icon:FiMove,         category:"mouse", color:"bg-blue-500",  params:[{name:"start_coordinate",type:"coordinate",label:"Start (x, y)",required:true},{name:"coordinate",type:"coordinate",label:"End (x, y)",required:true}] },
  { type:"scroll",          name:"Scroll",        description:"Scroll in direction",      icon:FiMousePointer, category:"mouse", color:"bg-blue-500",  params:[{name:"coordinate",type:"coordinate",label:"Position"},{name:"scroll_direction",type:"select",label:"Direction",required:true,options:[{value:"up",label:"Up"},{value:"down",label:"Down"},{value:"left",label:"Left"},{value:"right",label:"Right"}]},{name:"scroll_amount",type:"number",label:"Amount",required:true,default:3}] },
  { type:"click_text",      name:"Click Text",    description:"OCR click by label",       icon:FiMousePointer, category:"mouse", color:"bg-blue-500",  params:[{name:"text",type:"string",label:"Text to find",required:true},{name:"button",type:"select",label:"Click",options:[{value:"left",label:"Left"},{value:"right",label:"Right"},{value:"double",label:"Double"}],default:"left"}] },
  // keyboard
  { type:"type",   name:"Type Text",  description:"Type with keyboard",      icon:FiType,     category:"keyboard", color:"bg-green-500", params:[{name:"text",type:"string",label:"Text",required:true,placeholder:"Hello world..."}] },
  { type:"key",    name:"Press Key",  description:"Key or combo",            icon:FiType,     category:"keyboard", color:"bg-green-500", params:[{name:"text",type:"string",label:"Key(s)",required:true,placeholder:"cmd+c, enter..."}] },
  { type:"hotkey", name:"Hotkey",     description:"Simultaneous keys",       icon:FiType,     category:"keyboard", color:"bg-green-600", params:[{name:"keys",type:"string",label:"Keys (comma-separated)",required:true,placeholder:"cmd, shift, t"}] },
  // screen
  { type:"screenshot", name:"Screenshot", description:"Capture screen",     icon:FiMonitor,  category:"screen", color:"bg-orange-500", params:[] },
  { type:"find_text",  name:"Find Text",  description:"OCR search",         icon:FiMonitor,  category:"screen", color:"bg-orange-500", params:[{name:"text",type:"string",label:"Text to find",required:true}] },
  // utility
  { type:"wait",         name:"Wait",         description:"Pause",               icon:FiZap,      category:"utility", color:"bg-yellow-500", params:[{name:"duration",type:"number",label:"Seconds",required:true,default:1}] },
  { type:"shell",        name:"Run Command",  description:"Shell command",        icon:FiTerminal, category:"utility", color:"bg-yellow-500", params:[{name:"command",type:"string",label:"Command",required:true,placeholder:"ls -la"}] },
  { type:"open",         name:"Open",         description:"Open URL or file",     icon:FiGlobe,    category:"utility", color:"bg-yellow-600", params:[{name:"target",type:"string",label:"URL or path",required:true,placeholder:"https://..."}] },
  { type:"launch",       name:"Launch App",   description:"Start application",    icon:FiZap,      category:"utility", color:"bg-yellow-600", params:[{name:"app",type:"string",label:"App / path",required:true},{name:"args",type:"string",label:"Args (space-separated)"}] },
  { type:"focus_window", name:"Focus Window", description:"Bring window to front",icon:FiMonitor,  category:"utility", color:"bg-yellow-600", params:[{name:"app",type:"string",label:"App name (partial)"},{name:"title",type:"string",label:"Window title (partial)"}] },
  // assertions
  { type:"assert_text_visible",     name:"Assert Visible",     description:"Fail if text missing",     icon:FiCheckCircle, category:"assert", color:"bg-amber-500",  params:[{name:"text",type:"string",label:"Expected text",required:true},{name:"min_score",type:"number",label:"Min confidence (0–1)",default:0.7},{name:"message",type:"string",label:"Failure message"}] },
  { type:"assert_text_not_visible", name:"Assert Not Visible", description:"Fail if text present",     icon:FiXCircle,     category:"assert", color:"bg-red-500",    params:[{name:"text",type:"string",label:"Text must NOT appear",required:true},{name:"max_score",type:"number",label:"Max score (0–1)",default:0.7},{name:"message",type:"string",label:"Failure message"}] },
  { type:"assert_result_contains",  name:"Assert Output",      description:"Fail if output missing",   icon:FiShield,      category:"assert", color:"bg-violet-500", params:[{name:"expected",type:"string",label:"Expected substring",required:true},{name:"message",type:"string",label:"Failure message"}] },
];

// ─── Param summary (shown on node body) ───────────────────────────────────────
function paramSummary(node: WFNode, tool: ToolDef): string {
  const p = node.params;
  const coord = (k: string) => { const c = p[k] as [number,number]|undefined; return c ? `(${c[0]}, ${c[1]})` : "set position"; };
  switch (node.type) {
    case "webhook_trigger":      return "HTTP POST trigger";
    case "left_click": case "right_click": case "double_click":
    case "mouse_move": case "mouse_down": case "mouse_up":
                                 return coord("coordinate");
    case "left_click_drag":      return `${coord("start_coordinate")} → ${coord("coordinate")}`;
    case "type":                 return `"${String(p.text ?? "").slice(0,30)}"`;
    case "key":                  return String(p.text ?? "");
    case "hotkey":               return String(p.keys ?? "");
    case "scroll":               return `${p.scroll_direction} ×${p.scroll_amount}`;
    case "wait":                 return `${p.duration ?? 1}s`;
    case "shell":                return String(p.command ?? "").slice(0,30);
    case "open":                 return String(p.target ?? "").slice(0,30);
    case "launch":               return String(p.app ?? "");
    case "find_text": case "click_text": return `"${String(p.text ?? "").slice(0,28)}"`;
    case "assert_text_visible":  return `✓ "${String(p.text ?? "").slice(0,24)}"`;
    case "assert_text_not_visible": return `✗ "${String(p.text ?? "").slice(0,24)}"`;
    case "assert_result_contains":  return `∋ "${String(p.expected ?? "").slice(0,24)}"`;
    default: return tool.params.length ? `${tool.params.length} params` : tool.description;
  }
}
// ─── Main component ─────────────────────────────────────────────────────────
export default function WorkflowEditorPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const params       = useParams();
  const canvasRef    = useRef<HTMLDivElement>(null);
  const workflowId   = searchParams.get("id");
  const workspaceId  = params.workspaceId as string;

  const [workflow, setWorkflow] = useState<Workflow>({
    id: crypto.randomUUID(), name: "Untitled Workflow",
    nodes: [{ id: "trigger-1", type: "webhook_trigger", position: { x: 80, y: 180 }, params: {} }],
    published: false,
  });
  const [nodeOutputs,  setNodeOutputs]  = useState<Record<string, NodeOutput>>({});
  const [runningId,    setRunningId]    = useState<string | null>(null);
  // multi-select
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [configId,     setConfigId]     = useState<string | null>(null);
  const [addMenu,      setAddMenu]      = useState<{ afterId: string; x: number; y: number; search: string } | null>(null);
  const [showPublish,  setShowPublish]  = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [runners,      setRunners]      = useState<Runner[]>([]);
  const [runnerId,     setRunnerId]     = useState<string | null>(null);
  const [isSaving,     setIsSaving]     = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copiedHook,   setCopiedHook]   = useState(false);
  const [isLoading,    setIsLoading]    = useState(!!workflowId);
  // canvas zoom
  const [zoom,         setZoom]         = useState(1);
  const MIN_ZOOM = 0.3, MAX_ZOOM = 2, ZOOM_STEP = 0.1;
  function applyZoom(delta: number) {
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 10) / 10)));
  }
  // drag — delta-based so multi-node drag works correctly
  const [dragging, setDragging] = useState<{
    ids: string[];                                 // all nodes being moved
    startMX: number; startMY: number;              // mouse pos at drag start (viewport)
    origins: Record<string, { x: number; y: number }>; // node positions at drag start
  } | null>(null);
  const [dragCandidate, setDragCandidate] = useState<{ id: string; mx: number; my: number } | null>(null);
  const DRAG_THRESHOLD = 5;
  // marquee rubber-band selection
  // useRef = synchronous (no stale-closure problem across mouse events)
  // useState = drives the visual rectangle only
  const marqueeRef = useRef<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  const [marquee,   setMarquee] = useState<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  // prevent the canvas onClick from clearing selection after a marquee drag
  const didMarquee  = useRef(false);
  const [selectedConn, setSelectedConn] = useState<number | null>(null); // index into nodes.slice(1)

  // load workflow
  useEffect(() => {
    if (!workflowId) { setIsLoading(false); return; }
    fetch(`/api/workflows/get?id=${workflowId}`).then(r => r.json()).then(d => {
      if (d.workflow) {
        setWorkflow({ id: d.workflow.id, name: d.workflow.name, nodes: d.workflow.nodes || [], published: d.workflow.published, webhookKey: d.workflow.webhook_key_hash ? "(hidden)" : undefined, runnerId: d.workflow.runner_id });
        if (d.workflow.runner_id) setRunnerId(d.workflow.runner_id);
      }
    }).catch(console.error).finally(() => setIsLoading(false));
  }, [workflowId]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (!inInput) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (selectedConn !== null) {
            const target = workflow.nodes[selectedConn + 1];
            if (target) deleteNode(target.id);
            setSelectedConn(null);
          } else {
            workflow.nodes
              .filter(n => selectedIds.has(n.id) && n.type !== "webhook_trigger")
              .forEach(n => deleteNode(n.id));
          }
        }
        if (e.key === "Escape") {
          setSelectedIds(new Set()); setConfigId(null); setAddMenu(null);
          setShowShortcuts(false); setSelectedConn(null);
        }
        if (e.key === "n" || e.key === "N") {
          e.preventDefault();
          const lastNode = workflow.nodes[workflow.nodes.length - 1];
          setAddMenu({ afterId: lastNode.id, x: 0, y: 0, search: "" });
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        setSelectedIds(new Set(workflow.nodes.map(n => n.id))); // include trigger
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        const toCopy = workflow.nodes.filter(n => selectedIds.has(n.id));
        if (!toCopy.length) return;
        // strip id (re-assigned on paste) + never copy secrets
        const payload = JSON.stringify({
          __cua_nodes__: true,
          nodes: toCopy.map(({ id: _id, ...rest }) => rest),
          // explicitly omit webhookKey and runnerId
        });
        navigator.clipboard.writeText(payload).catch(() => {});
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "v" && !inInput) {
        e.preventDefault();
        navigator.clipboard.readText().then(text => {
          try {
            const data = JSON.parse(text);
            if (!data.__cua_nodes__ || !Array.isArray(data.nodes)) return;
            const offset = 40;
            const pasted: WFNode[] = data.nodes.map((n: Omit<WFNode,"id">) => ({
              ...n, id: crypto.randomUUID(),
              position: { x: (n.position?.x ?? 100) + offset, y: (n.position?.y ?? 100) + offset },
            }));
            setWorkflow(w => ({ ...w, nodes: [...w.nodes, ...pasted] }));
            setSelectedIds(new Set(pasted.map(n => n.id)));
          } catch { /* not cua JSON */ }
        }).catch(() => {});
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); testRun(); }
      if (e.key === "?" && !inInput) { e.preventDefault(); setShowShortcuts(s => !s); }
      if ((e.metaKey || e.ctrlKey) && (e.key === "+" || e.key === "=")) { e.preventDefault(); applyZoom(ZOOM_STEP); }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") { e.preventDefault(); applyZoom(-ZOOM_STEP); }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") { e.preventDefault(); setZoom(1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, selectedConn, workflow]);

  // ── handlers ───────────────────────────────────────────────────────────────
  function addNodeAfter(toolType: string, afterId: string) {
    const tool = TOOLS.find(t => t.type === toolType);
    if (!tool) return;
    const defaults: Record<string, unknown> = {};
    tool.params.forEach(p => { if (p.default !== undefined) defaults[p.name] = p.default; else if (p.type === "coordinate") defaults[p.name] = [0,0]; });
    const idx  = workflow.nodes.findIndex(n => n.id === afterId);
    const prev = workflow.nodes[idx];
    const newNode: WFNode = { id: crypto.randomUUID(), type: toolType, position: { x: prev.position.x + 290, y: prev.position.y }, params: defaults };
    setWorkflow(w => ({ ...w, nodes: [...w.nodes.slice(0, idx+1), newNode, ...w.nodes.slice(idx+1)] }));
    setSelectedIds(new Set([newNode.id]));
    setConfigId(newNode.id);
    setAddMenu(null);
  }

  function updateNode(id: string, params: Record<string, unknown>) {
    setWorkflow(w => ({ ...w, nodes: w.nodes.map(n => n.id === id ? { ...n, params: { ...n.params, ...params } } : n) }));
  }
  function updateNodeName(id: string, name: string) {
    setWorkflow(w => ({ ...w, nodes: w.nodes.map(n => n.id === id ? { ...n, name: name || undefined } : n) }));
  }
  function deleteNode(id: string) {
    const node = workflow.nodes.find(n => n.id === id);
    if (!node || node.type === "webhook_trigger") return;
    setWorkflow(w => ({ ...w, nodes: w.nodes.filter(n => n.id !== id) }));
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    if (configId === id) setConfigId(null);
  }

  function exportWorkflow() {
    const json = JSON.stringify({
      __cua_nodes__: true,
      nodes: workflow.nodes.map(({ id: _id, ...rest }) => rest),
      // webhookKey and runnerId intentionally omitted
    }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${workflow.name.replace(/\s+/g, "-")}.json`; a.click();
  }
  function importFromClipboard() {
    navigator.clipboard.readText().then(text => {
      try {
        const data = JSON.parse(text);
        const nodes: Omit<WFNode,"id">[] = data.__cua_nodes__ ? data.nodes : data;
        if (!Array.isArray(nodes)) return;
        const imported: WFNode[] = nodes.map((n: Omit<WFNode,"id">) => ({ ...n, id: crypto.randomUUID() }));
        const hasTrigger = imported.some(n => n.type === "webhook_trigger");
        if (hasTrigger) {
          setWorkflow(w => ({ ...w, nodes: imported }));
        } else {
          setWorkflow(w => ({ ...w, nodes: [...w.nodes, ...imported] }));
        }
        setSelectedIds(new Set(imported.map(n => n.id)));
      } catch { alert("Clipboard does not contain valid workflow JSON"); }
    }).catch(() => alert("Could not read clipboard"));
  }

  async function save() {
    if (!workspaceId) return;
    setIsSaving(true);
    try {
      await fetch("/api/workflows/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflow, workspaceId }) });
      if (!workflowId) router.replace(`/workspace/${workspaceId}/automation/editor?id=${workflow.id}`);
    } catch(e) { console.error(e); } finally { setIsSaving(false); }
  }

  async function testRun() {
    const target = runnerId ?? workflow.runnerId;
    if (!target) { setShowPublish(true); return; }
    const actionNodes = workflow.nodes.filter(n => n.type !== "webhook_trigger");
    if (!actionNodes.length) return;
    setNodeOutputs({});
    for (const node of actionNodes) {
      setRunningId(node.id);
      const t0 = Date.now();
      try {
        const res  = await fetch("/api/workflows/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runnerId: target, action: { type: node.type, ...node.params } }) });
        const data = await res.json();
        const ok   = res.ok && !data.error;
        setNodeOutputs(prev => ({ ...prev, [node.id]: { success: ok, text: ok ? (data.result?.text ?? JSON.stringify(data.result)) : (data.error ?? "Failed"), durationMs: Date.now()-t0, resultType: data.result?.type ?? "text" } }));
        if (!ok) break;
      } catch(err) {
        setNodeOutputs(prev => ({ ...prev, [node.id]: { success: false, text: String(err), durationMs: Date.now()-t0, resultType: "error" } }));
        break;
      }
    }
    setRunningId(null);
  }

  async function openPublish() {
    setShowPublish(true);
    const res = await fetch(`/api/runners/live?workspaceId=${workspaceId}`).then(r => r.json()).catch(() => ({ runners: [] }));
    setRunners(res.runners ?? []);
  }
  async function publishWorkflow() {
    const target = runnerId ?? workflow.runnerId;
    if (!target) return;
    setIsPublishing(true);
    try {
      const res  = await fetch("/api/workflows/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflow: { ...workflow, runnerId: target }, workspaceId }) });
      const data = await res.json();
      if (res.ok) setWorkflow(w => ({ ...w, published: true, webhookKey: data.webhookKey, runnerId: target }));
    } catch(e) { console.error(e); } finally { setIsPublishing(false); }
  }

  // ── drag (multi-node delta-based) ──────────────────────────────────────────
  function onNodeMouseDown(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (e.shiftKey) {
      setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    } else {
      if (!selectedIds.has(id)) setSelectedIds(new Set([id]));
    }
    setDragCandidate({ id, mx: e.clientX, my: e.clientY });
  }
  function onCanvasMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    if (!e.shiftKey) setSelectedIds(new Set());
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left) / zoom;
    const cy = (e.clientY - rect.top)  / zoom;
    const m = { sx: cx, sy: cy, ex: cx, ey: cy };
    marqueeRef.current = m;   // sync — available immediately in next mousemove
    setMarquee(m);            // async — drives the visual rect
    didMarquee.current = false;
  }
  function onCanvasMouseMove(e: React.MouseEvent) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Activate drag once past threshold
    if (dragCandidate && !dragging) {
      const dx = Math.abs(e.clientX - dragCandidate.mx);
      const dy = Math.abs(e.clientY - dragCandidate.my);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        const ids = selectedIds.has(dragCandidate.id) ? Array.from(selectedIds) : [dragCandidate.id];
        const origins: Record<string, { x: number; y: number }> = {};
        workflow.nodes.forEach(n => { if (ids.includes(n.id)) origins[n.id] = { ...n.position }; });
        setDragging({ ids, startMX: dragCandidate.mx, startMY: dragCandidate.my, origins });
      }
    }

    if (dragging) {
      const dx = (e.clientX - dragging.startMX) / zoom;
      const dy = (e.clientY - dragging.startMY) / zoom;
      setWorkflow(w => ({
        ...w, nodes: w.nodes.map(n => {
          if (!dragging.ids.includes(n.id)) return n;
          const o = dragging.origins[n.id];
          return { ...n, position: { x: Math.max(0, o.x + dx), y: Math.max(0, o.y + dy) } };
        }),
      }));
    }

    // Marquee — read from ref (always current, no stale-closure issue)
    if (marqueeRef.current) {
      const cx = (e.clientX - rect.left) / zoom;
      const cy = (e.clientY - rect.top)  / zoom;
      const updated = { ...marqueeRef.current, ex: cx, ey: cy };
      marqueeRef.current = updated;   // sync
      setMarquee({ ...updated });     // trigger render for visual
      didMarquee.current = true;
    }
  }
  function onCanvasMouseUp(e: React.MouseEvent) {
    setDragging(null); setDragCandidate(null);
    const m = marqueeRef.current;   // read from ref — always latest
    if (m) {
      const mx1 = Math.min(m.sx, m.ex), mx2 = Math.max(m.sx, m.ex);
      const my1 = Math.min(m.sy, m.ey), my2 = Math.max(m.sy, m.ey);
      if (mx2 - mx1 > 5 || my2 - my1 > 5) {
        const hit = workflow.nodes.filter(n =>
          n.type !== "webhook_trigger" &&
          n.position.x < mx2 && n.position.x + NODE_W > mx1 &&
          n.position.y < my2 && n.position.y + NODE_H * 2 > my1
        );
        setSelectedIds(prev => {
          const s = e.shiftKey ? new Set(prev) : new Set<string>();
          hit.forEach(n => s.add(n.id));
          return s;
        });
      }
      marqueeRef.current = null;
      setMarquee(null);
    }
  }

  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/workflows/trigger/${workflow.id}` : "";
  const configNode = workflow.nodes.find(n => n.id === configId);
  const configTool = configNode ? TOOLS.find(t => t.type === configNode.type) : null;

  if (isLoading) return <main className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white/30">Loading…</main>;

  return (
    <main className="flex h-screen flex-col bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push(`/workspace/${workspaceId}/automation`)} className="text-white/30 hover:text-white shrink-0"><FiArrowLeft className="size-4" /></button>
          <div className="w-px h-4 bg-white/[0.06] shrink-0" />
          <input value={workflow.name} onChange={e => setWorkflow(w => ({ ...w, name: e.target.value }))} className="bg-transparent text-sm font-medium text-white/80 outline-none min-w-0 w-40" />
          {workflow.published && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 shrink-0">Published</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:flex items-center gap-3 text-[10px] text-white/20 mr-2">
            <span>⌘S save</span><span>⌘↵ run</span><span>Del delete</span><span>Esc deselect</span>
          </span>
          <Button variant="outline" onClick={save} disabled={isSaving} className="h-8 border-white/[0.08] px-3 text-xs text-white/40 hover:text-white hover:bg-white/[0.04]">
            <FiSave className="mr-1.5 size-3" />{isSaving ? "Saving…" : "Save"}
          </Button>
          <Button variant="outline" onClick={exportWorkflow} title="Export workflow JSON" className="h-8 border-white/[0.08] px-3 text-xs text-white/40 hover:text-white hover:bg-white/[0.04]">
            Export
          </Button>
          <Button variant="outline" onClick={importFromClipboard} title="Import from clipboard (paste workflow JSON)" className="h-8 border-white/[0.08] px-3 text-xs text-white/40 hover:text-white hover:bg-white/[0.04]">
            Import
          </Button>
          <Button onClick={testRun} disabled={!!runningId} className="h-8 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] px-3 text-xs text-white/70">
            <FiPlay className="mr-1.5 size-3" />{runningId ? "Running…" : "Test Run"}
          </Button>
          <Button onClick={openPublish} className="h-8 bg-emerald-500 hover:bg-emerald-600 px-3 text-xs text-white">
            <FiGlobe className="mr-1.5 size-3" />Publish
          </Button>
          <button
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts (?)"
            className="ml-1 flex size-8 items-center justify-center rounded-lg border border-white/[0.08] text-white/25 hover:border-white/20 hover:text-white/60 transition-colors"
          >
            <FiHelpCircle className="size-4" />
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-hidden bg-[#080808] select-none"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: `${24 * zoom}px ${24 * zoom}px` }}
        onClick={() => {
          // don't clear selection if we just finished a marquee drag
          if (didMarquee.current) { didMarquee.current = false; return; }
          setSelectedIds(new Set()); setAddMenu(null); setSelectedConn(null);
        }}
        onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
        onMouseLeave={() => { setDragging(null); setDragCandidate(null); marqueeRef.current = null; setMarquee(null); }}
        onWheel={e => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            applyZoom(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
          }
        }}
      >
        {/* Zoomable layer */}
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%`, height: `${100 / zoom}%` }}>
        {/* SVG connections — pointer-events on each path individually */}
        <svg className="absolute inset-0 size-full overflow-visible" style={{ pointerEvents: "none" }}>
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.15)" />
            </marker>
            <marker id="arrow-sel" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(239,68,68,0.8)" />
            </marker>
          </defs>
          {workflow.nodes.slice(1).map((node, i) => {
            const prev = workflow.nodes[i];
            const sx = prev.position.x + NODE_W, sy = prev.position.y + NODE_H / 2;
            const ex = node.position.x,          ey = node.position.y + NODE_H / 2;
            const mx = (sx + ex) / 2;
            const isSel = selectedConn === i;
            return (
              <g key={node.id} style={{ pointerEvents: "stroke" }}>
                {/* Invisible fat hit-area path */}
                <path
                  d={`M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`}
                  fill="none" stroke="transparent" strokeWidth="12"
                  style={{ pointerEvents: "stroke", cursor: "pointer" }}
                  onClick={e => { e.stopPropagation(); setSelectedConn(isSel ? null : i); setSelectedIds(new Set()); }}
                />
                {/* Visible path */}
                <path
                  d={`M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`}
                  fill="none"
                  stroke={isSel ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.12)"}
                  strokeWidth={isSel ? 2 : 1.5}
                  strokeDasharray={isSel ? "5 3" : undefined}
                  markerEnd={isSel ? "url(#arrow-sel)" : "url(#arrow)"}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {workflow.nodes.map((node) => {
          const tool = TOOLS.find(t => t.type === node.type);
          if (!tool) return null;
          const output   = nodeOutputs[node.id];
          const running  = runningId === node.id;
          const selected = selectedIds.has(node.id);
          return (
            <NodeCard
              key={node.id}
              node={node} tool={tool}
              selected={selected} running={running} output={output ?? null}
              onSelect={(e) => {
                if (e.shiftKey) {
                  setSelectedIds(prev => { const s = new Set(prev); s.has(node.id) ? s.delete(node.id) : s.add(node.id); return s; });
                } else {
                  setSelectedIds(new Set([node.id]));
                }
              }}
              onOpen={() => { setSelectedIds(new Set([node.id])); setConfigId(node.id); }}
              onMouseDown={e => onNodeMouseDown(e, node.id)}
              onAdd={(x, y) => setAddMenu({ afterId: node.id, x, y, search: "" })}
            />
          );
        })}

        {/* Empty hint */}
        {workflow.nodes.length === 1 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="ml-[300px] rounded-lg border border-dashed border-white/[0.06] px-5 py-3 text-center">
              <p className="text-xs text-white/20">Click <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px]">+</kbd> on the trigger node to add a step</p>
            </div>
          </div>
        )}
        </div>{/* /zoomable layer */}

        {/* Marquee selection rectangle */}
        {marquee && (() => {
          const x = Math.min(marquee.sx, marquee.ex) * zoom;
          const y = Math.min(marquee.sy, marquee.ey) * zoom;
          const w = Math.abs(marquee.ex - marquee.sx) * zoom;
          const h = Math.abs(marquee.ey - marquee.sy) * zoom;
          return (
            <div className="pointer-events-none absolute z-20 rounded border border-blue-400/60 bg-blue-400/10"
              style={{ left: x, top: y, width: w, height: h }} />
          );
        })()}

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#111]/90 px-2 py-1 backdrop-blur-sm">
          <button onClick={() => applyZoom(-ZOOM_STEP)} className="flex size-6 items-center justify-center rounded text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors text-sm">−</button>
          <button onClick={() => setZoom(1)} className="px-2 text-[10px] tabular-nums text-white/30 hover:text-white transition-colors min-w-[3rem] text-center">{Math.round(zoom * 100)}%</button>
          <button onClick={() => applyZoom(ZOOM_STEP)}  className="flex size-6 items-center justify-center rounded text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors text-sm">+</button>
        </div>

        {/* Add-node menu — fixed + centered, Esc closes it */}
        {addMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setAddMenu(null)} />
            <div
              className="fixed z-50 w-[300px] max-w-[92vw] rounded-xl border border-white/[0.08] bg-[#111] shadow-2xl overflow-hidden"
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); setAddMenu(null); } }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
                <div className="flex items-center gap-2 flex-1">
                  <FiSearch className="size-3.5 text-white/30 shrink-0" />
                  <input
                    autoFocus
                    value={addMenu.search}
                    onChange={e => setAddMenu(m => m ? { ...m, search: e.target.value } : m)}
                    onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); setAddMenu(null); } }}
                    placeholder="Search actions…"
                    className="flex-1 bg-transparent text-[11px] text-white/70 outline-none placeholder:text-white/20"
                  />
                </div>
                <button onClick={() => setAddMenu(null)} className="ml-2 text-white/25 hover:text-white transition-colors shrink-0">
                  <FiX className="size-3.5" />
                </button>
              </div>
              {/* List */}
              <div className="max-h-[60vh] overflow-y-auto py-1">
                {(["mouse","keyboard","screen","utility","assert"] as const).map(cat => {
                  const items = TOOLS.filter(t => t.category === cat && (addMenu.search === "" || t.name.toLowerCase().includes(addMenu.search.toLowerCase()) || t.description.toLowerCase().includes(addMenu.search.toLowerCase())));
                  if (!items.length) return null;
                  return (
                    <div key={cat}>
                      <p className={`px-3 pt-2 pb-0.5 text-[9px] uppercase tracking-wider ${cat === "assert" ? "text-amber-500/50" : "text-white/25"}`}>
                        {cat === "assert" ? "⚠ Assertions" : cat}
                      </p>
                      {items.map(tool => (
                        <button key={tool.type} onClick={() => addNodeAfter(tool.type, addMenu.afterId)}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-white/[0.04]">
                          <div className={`rounded-md p-1.5 ${tool.color} shrink-0`}><tool.icon className="size-3 text-white" /></div>
                          <div>
                            <p className="text-[11px] text-white/70">{tool.name}</p>
                            <p className="text-[9px] text-white/25">{tool.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
                {addMenu.search && TOOLS.filter(t => t.category !== "trigger" && (t.name.toLowerCase().includes(addMenu.search.toLowerCase()) || t.description.toLowerCase().includes(addMenu.search.toLowerCase()))).length === 0 && (
                  <p className="px-3 py-4 text-[11px] text-white/20">No results for "{addMenu.search}"</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Config dialog */}
      {configId && configNode && configTool && (
        <NodeConfigDialog
          node={configNode} tool={configTool}
          onClose={() => setConfigId(null)}
          onUpdate={p => updateNode(configId, p)}
          onRename={name => updateNodeName(configId, name)}
          onDelete={() => { deleteNode(configId); setConfigId(null); }}
        />
      )}

      {/* Publish modal */}
      {showPublish && (
        <PublishModal
          workflow={workflow} runners={runners} runnerId={runnerId ?? workflow.runnerId ?? null}
          isPublishing={isPublishing} copiedHook={copiedHook} webhookUrl={webhookUrl}
          onSelectRunner={setRunnerId}
          onPublish={publishWorkflow}
          onCopy={async () => { await navigator.clipboard.writeText(webhookUrl); setCopiedHook(true); setTimeout(() => setCopiedHook(false), 2000); }}
          onRepublish={() => setWorkflow(w => ({ ...w, published: false }))}
          onClose={() => setShowPublish(false)}
        />
      )}

      {/* Shortcuts dialog */}
      {showShortcuts && <ShortcutsDialog onClose={() => setShowShortcuts(false)} />}
    </main>
  );
}

// ─── NodeCard ─────────────────────────────────────────────────────────────────
function NodeCard({ node, tool, selected, running, output, onSelect, onOpen, onMouseDown, onAdd }: {
  node: WFNode; tool: ToolDef; selected: boolean; running: boolean; output: NodeOutput | null;
  onSelect: (e: React.MouseEvent) => void; onOpen: () => void; onMouseDown: (e: React.MouseEvent) => void;
  onAdd: (x: number, y: number) => void;
}) {
  const isAssert = tool.category === "assert";
  const summary  = paramSummary(node, tool);
  return (
    <div
      className="absolute group"
      data-node="true"
      style={{ left: node.position.x, top: node.position.y, width: NODE_W }}
      onClick={e => { e.stopPropagation(); onSelect(e); }}
      onDoubleClick={e => { e.stopPropagation(); onOpen(); }}
      onMouseDown={onMouseDown}
    >
      {/* Input handle */}
      {node.type !== "webhook_trigger" && (
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 size-3.5 rounded-full border-2 border-white/25 bg-[#0d0d0d] z-10" />
      )}

      {/* Card */}
      <div className={`rounded-xl border bg-[#161616] cursor-move transition-all ${
        selected ? "border-blue-500/50 shadow-md shadow-blue-500/10" : "border-white/[0.08] hover:border-white/[0.15]"
      } ${isAssert ? "ring-1 ring-amber-500/30" : ""}`}>
        {/* Header */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className={`shrink-0 rounded-lg p-1.5 ${tool.color}`}>
            <tool.icon className="size-3 text-white" />
          </div>
          <span className="flex-1 truncate text-[11px] font-medium text-white/80">
            {node.name || tool.name}
          </span>
          {/* Status dot */}
          {running && <span className="size-2 rounded-full bg-blue-400 animate-pulse" />}
          {!running && output && (
            <span className={`size-2 rounded-full ${output.success ? "bg-emerald-400" : "bg-red-400"}`} />
          )}
          {/* Edit icon on hover */}
          <button
            onClick={e => { e.stopPropagation(); onOpen(); }}
            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white transition-opacity"
          >
            <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
        {/* Param summary */}
        <div className="border-t border-white/[0.05] px-3 py-1.5">
          <p className="truncate text-[9px] text-white/25">{summary}</p>
        </div>
      </div>

      {/* Output badge */}
      {output && (
        <div className={`mt-1.5 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[9px] ${
          output.success ? "bg-emerald-500/10 text-emerald-400/80" : "bg-red-500/10 text-red-400/80"
        }`}>
          <span>{output.success ? "✓" : "✗"}</span>
          <span className="truncate flex-1">{
            output.resultType === "image" ? "Screenshot captured" : output.text.slice(0, 55)
          }</span>
          <span className="shrink-0 tabular-nums text-white/20">{output.durationMs}ms</span>
        </div>
      )}
      {running && (
        <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-2.5 py-1 text-[9px] text-blue-400/70">
          <span className="animate-pulse">●</span><span>Running…</span>
        </div>
      )}

      {/* Output handle + add button */}
      <div className="absolute -right-7 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
        <div className="size-3.5 rounded-full border-2 border-white/25 bg-[#0d0d0d]" />
        <button
          onClick={e => {
            e.stopPropagation();
            const rect = (e.currentTarget.closest(".absolute") as HTMLElement)?.getBoundingClientRect();
            const canvas = (e.currentTarget.closest("[class*='overflow-hidden']") as HTMLElement)?.getBoundingClientRect();
            if (rect && canvas) onAdd(rect.right - canvas.left + 12, rect.top - canvas.top - 20);
          }}
          className="size-5 rounded-full border border-white/[0.12] bg-[#1a1a1a] text-white/30 hover:border-blue-500/50 hover:text-blue-400 flex items-center justify-center transition-colors"
          title="Add node after (Tab)"
        >
          <FiPlus className="size-2.5" />
        </button>
      </div>
    </div>
  );
}

// ─── NodeConfigDialog ─────────────────────────────────────────────────────────
function NodeConfigDialog({ node, tool, onClose, onUpdate, onRename, onDelete }: {
  node: WFNode; tool: ToolDef;
  onClose: () => void; onUpdate: (p: Record<string, unknown>) => void;
  onRename: (name: string) => void; onDelete: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Auto-focus first input when dialog opens
  useEffect(() => {
    const t = setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select');
      first?.focus();
    }, 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}
    >
      <div ref={dialogRef} className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className={`rounded-xl p-2.5 ${tool.color}`}>
            <tool.icon className="size-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white/90">{tool.name}</p>
            <p className="text-[10px] text-white/30">{tool.description}</p>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white p-1">
            <FiX className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
          {/* Step name */}
          <div>
            <label className="mb-1.5 block text-[10px] text-white/35">Step Label</label>
            <input
              value={node.name ?? ""}
              onChange={e => onRename(e.target.value)}
              placeholder={tool.name}
              className="w-full rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-white/70 outline-none focus:border-white/20"
            />
          </div>

          {/* Assertion info */}
          {tool.category === "assert" && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
              <p className="text-[10px] text-amber-400/80">
                <strong>Checkpoint.</strong> Workflow stops here if the condition is not met.
              </p>
            </div>
          )}

          {/* Params */}
          {node.type === "webhook_trigger" ? (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[10px] text-white/40">Triggered by HTTP POST to:</p>
              <code className="mt-1.5 block break-all rounded bg-black/30 px-2 py-1.5 font-mono text-[10px] text-white/50">
                POST /api/workflows/trigger/{node.id.slice(0,8)}…
              </code>
            </div>
          ) : (
            tool.params.map(param => (
              <ParamInput key={param.name} param={param}
                value={node.params[param.name]}
                onChange={v => onUpdate({ [param.name]: v })}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {node.type !== "webhook_trigger" && (
          <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
            <button onClick={onDelete}
              className="flex items-center gap-1.5 text-xs text-red-400/50 hover:text-red-400 transition-colors">
              <FiTrash2 className="size-3.5" /> Delete step
            </button>
            <Button onClick={onClose} className="h-8 bg-white px-4 text-xs text-black hover:bg-white/90">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PublishModal ─────────────────────────────────────────────────────────────
function PublishModal({ workflow, runners, runnerId, isPublishing, copiedHook, webhookUrl, onSelectRunner, onPublish, onCopy, onRepublish, onClose }: {
  workflow: Workflow; runners: Runner[]; runnerId: string | null;
  isPublishing: boolean; copiedHook: boolean; webhookUrl: string;
  onSelectRunner: (id: string) => void; onPublish: () => void;
  onCopy: () => void; onRepublish: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/20 p-2.5"><FiGlobe className="size-5 text-emerald-400" /></div>
            <div>
              <h2 className="text-base font-semibold text-white">Publish Workflow</h2>
              <p className="text-[10px] text-white/30">Generate webhook · assign runner</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white"><FiX className="size-5" /></button>
        </div>

        {workflow.published ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-emerald-400 mb-3"><FiCheck className="size-4" /><span className="text-sm font-medium">Published</span></div>
              <p className="text-[10px] text-white/30 mb-1">Webhook URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-black/30 px-2 py-1.5 font-mono text-[10px] text-white/50">{webhookUrl}</code>
                <button onClick={onCopy} className="rounded bg-white/[0.06] p-1.5 text-white/30 hover:text-white">
                  {copiedHook ? <FiCheck className="size-3.5 text-emerald-400" /> : <FiCopy className="size-3.5" />}
                </button>
              </div>
              {workflow.webhookKey && workflow.webhookKey !== "(hidden)" && (
                <>
                  <p className="text-[10px] text-white/30 mt-3 mb-1">Webhook Key (x-webhook-key header)</p>
                  <code className="block rounded bg-black/30 px-2 py-1.5 font-mono text-[10px] text-white/50">{workflow.webhookKey}</code>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onRepublish} className="flex-1 h-9 border-white/[0.08] text-sm text-white/40 hover:text-white hover:bg-white/[0.04]">Republish</Button>
              <Button onClick={onClose} className="flex-1 h-9 bg-white text-sm text-black hover:bg-white/90">Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-white/40 mb-2"><FiCpu className="inline mr-1 size-3" />Select Runner</p>
              {runners.filter(r => r.status === "online").length === 0 ? (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
                  <FiCpu className="mx-auto size-6 text-white/15 mb-2" />
                  <p className="text-xs text-white/25">No runners connected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {runners.filter(r => r.status === "online").map(r => (
                    <button key={r.id} onClick={() => onSelectRunner(r.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${runnerId === r.id ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"}`}>
                      <FiCpu className="size-4 text-white/40" />
                      <div className="flex-1">
                        <p className="text-xs text-white/70">{r.name}</p>
                        <p className="text-[10px] text-emerald-400/60">Connected</p>
                      </div>
                      {runnerId === r.id && <FiCheck className="size-4 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 flex gap-2">
              <FiLock className="size-4 shrink-0 text-yellow-500/50 mt-0.5" />
              <p className="text-[10px] text-yellow-500/70">A secure webhook key is generated. Pass it as <code className="rounded bg-black/20 px-1">x-webhook-key</code> when triggering.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 h-9 border-white/[0.08] text-sm text-white/40 hover:text-white hover:bg-white/[0.04]">Cancel</Button>
              <Button onClick={onPublish} disabled={!runnerId || isPublishing} className="flex-1 h-9 bg-emerald-500 text-sm text-white hover:bg-emerald-600 disabled:opacity-40">
                {isPublishing ? "Publishing…" : "Publish"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ParamInput ───────────────────────────────────────────────────────────────
function ParamInput({ param, value, onChange }: { param: ToolParam; value: unknown; onChange: (v: unknown) => void }) {
  const base = "w-full rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs text-white/70 outline-none focus:border-white/20";
  return (
    <div>
      <label className="mb-1.5 block text-[10px] text-white/35">
        {param.label}{param.required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {param.type === "coordinate" ? (
        <div className="flex gap-2">
          {["X","Y"].map((axis, i) => (
            <input key={axis} type="number" placeholder={axis}
              value={((value as [number,number]) ?? [0,0])[i]}
              onChange={e => { const c = [...((value as [number,number]) ?? [0,0])] as [number,number]; c[i] = parseInt(e.target.value)||0; onChange(c); }}
              className={base} />
          ))}
        </div>
      ) : param.type === "select" ? (
        <select value={(value as string) ?? param.default ?? ""} onChange={e => onChange(e.target.value)} className={base}>
          <option value="">Select…</option>
          {param.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : param.type === "number" ? (
        <input type="number" value={(value as number) ?? param.default ?? ""} placeholder={param.placeholder}
          onChange={e => onChange(parseFloat(e.target.value)||0)} className={base} />
      ) : (
        <input type="text" value={(value as string) ?? ""} placeholder={param.placeholder}
          onChange={e => onChange(e.target.value)} className={base} />
      )}
    </div>
  );
}

// ─── ShortcutsDialog ──────────────────────────────────────────────────────────
const SHORTCUTS: { section: string; rows: { keys: string[]; description: string }[] }[] = [
  {
    section: "General",
    rows: [
      { keys: ["⌘", "S"],      description: "Save workflow" },
      { keys: ["⌘", "↵"],      description: "Test Run — execute all steps on the connected runner" },
      { keys: ["?"],            description: "Open / close this shortcuts dialog" },
      { keys: ["Esc"],          description: "Deselect node · close dialogs · clear selection" },
    ],
  },
  {
    section: "Canvas",
    rows: [
      { keys: ["N"],            description: "Open add-node menu (adds after last node)" },
      { keys: ["Right-click"],  description: "Open add-node menu at cursor position" },
      { keys: ["+"],            description: "Add node after — click the + handle on any node" },
      { keys: ["⌘", "+"],       description: "Zoom in" },
      { keys: ["⌘", "-"],       description: "Zoom out" },
      { keys: ["⌘", "0"],       description: "Reset zoom to 100%" },
      { keys: ["Ctrl+Wheel"],   description: "Pinch-to-zoom with trackpad / mouse wheel" },
    ],
  },
  {
    section: "Node",
    rows: [
      { keys: ["Click"],        description: "Select node" },
      { keys: ["Double-click"], description: "Open configuration dialog" },
      { keys: ["Del", "⌫"],    description: "Delete selected node (not the trigger)" },
      { keys: ["Drag"],         description: "Reposition node (activates after 5 px)" },
    ],
  },
  {
    section: "Connection",
    rows: [
      { keys: ["Click"],        description: "Select connection line (turns red + dashed)" },
      { keys: ["Del", "⌫"],    description: "Delete selected connection's destination node" },
      { keys: ["Esc"],          description: "Deselect connection" },
    ],
  },
  {
    section: "Configuration dialog",
    rows: [
      { keys: ["Esc"],          description: "Close dialog" },
      { keys: ["Tab"],          description: "Move between fields" },
    ],
  },
  {
    section: "Add-node menu",
    rows: [
      { keys: ["Type"],         description: "Filter actions by name or description" },
      { keys: ["Esc"],          description: "Close menu" },
    ],
  },
];

function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#111] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/[0.06] p-2.5">
              <FiHelpCircle className="size-4 text-white/50" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90">Keyboard Shortcuts</p>
              <p className="text-[10px] text-white/30">Press <Kbd>?</Kbd> anytime to toggle</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white p-1 transition-colors">
            <FiX className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-5">
          {SHORTCUTS.map(section => (
            <div key={section.section}>
              <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-white/25">
                {section.section}
              </p>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                {section.rows.map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-4 py-2.5 ${
                      i !== section.rows.length - 1 ? "border-b border-white/[0.04]" : ""
                    }`}
                  >
                    <span className="text-[11px] text-white/50">{row.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      {row.keys.map((k, ki) => (
                        <Kbd key={ki}>{k}</Kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-5 py-3 flex justify-end">
          <Button onClick={onClose} className="h-8 bg-white px-5 text-xs text-black hover:bg-white/90">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-white/60 min-w-[1.5rem]">
      {children}
    </kbd>
  );
}
