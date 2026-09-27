import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto";

import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { workflowId } = await params;
    const webhookKey = request.headers.get("x-webhook-key");

    if (!webhookKey) {
      return NextResponse.json(
        { error: "Missing x-webhook-key header" },
        { status: 401 }
      );
    }

    // Hash the provided key
    const webhookKeyHash = crypto
      .createHash("sha256")
      .update(webhookKey)
      .digest("hex");

    // Use admin client to bypass RLS for webhook triggers
    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e) {
      console.error("Failed to create admin client:", e);
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Find the workflow
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("webhook_key_hash", webhookKeyHash)
      .eq("published", true)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: "Invalid workflow or webhook key" },
        { status: 401 }
      );
    }

    // Get the runner
    const { data: runner, error: runnerError } = await supabase
      .from("runners")
      .select("id, name, status")
      .eq("id", workflow.runner_id)
      .single();

    if (runnerError || !runner) {
      return NextResponse.json(
        { error: "Runner not found" },
        { status: 404 }
      );
    }

    if (runner.status !== "online") {
      return NextResponse.json(
        { error: "Runner is offline", runner: { id: runner.id, status: runner.status } },
        { status: 503 }
      );
    }

    // Get request body for passing to workflow
    let payload = {};
    try {
      payload = await request.json();
    } catch {
      // Empty body is fine
    }

    // Build the actions to execute in edge-defined order (skip the webhook trigger)
    const raw = workflow.nodes as { nodes: unknown[]; edges: { from: string; to: string }[] } | unknown[];
    const allNodes: { id: string; type: string; params: Record<string, unknown> }[] =
      Array.isArray(raw) ? (raw as never) : ((raw as { nodes: unknown[] }).nodes as never);
    const edges: { from: string; to: string }[] =
      Array.isArray(raw) ? [] : (raw as { edges: { from: string; to: string }[] }).edges ?? [];

    // Traverse edges from trigger to build ordered action list
    const trigger = allNodes.find(n => n.type === "webhook_trigger");
    const orderedNodes: typeof allNodes = [];
    if (trigger) {
      const visited = new Set<string>();
      let cur: string | undefined = trigger.id;
      while (cur && !visited.has(cur)) {
        const node = allNodes.find(n => n.id === cur);
        if (node) orderedNodes.push(node);
        visited.add(cur);
        cur = edges.find(e => e.from === cur)?.to;
      }
    } else {
      orderedNodes.push(...allNodes);
    }

    const actionNodes = orderedNodes.filter(node => node.type !== "webhook_trigger");
    const actions = actionNodes.map(node => ({ type: node.type, ...node.params }));

    // Create an execution record up front so it appears immediately in monitoring
    const executionId = crypto.randomUUID();
    const startedAt = new Date();
    await supabase.from("workflow_executions").insert({
      id: executionId,
      workflow_id: workflowId,
      runner_id: runner.id,
      status: "running",
      trigger_source: "webhook",
      payload,
      steps_total: actions.length,
      steps_completed: 0,
      started_at: startedAt.toISOString(),
    });

    // Build a step log entry for each action node
    const buildLogs = (
      results: unknown[],
      failedAt: number | null,
      failedMessage: string | null,
    ) =>
      actionNodes.map((node, i) => {
        let status: "completed" | "failed" | "skipped";
        let result: unknown = null;
        let error: string | null = null;

        if (failedAt !== null && i === failedAt) {
          status = "failed";
          error = failedMessage;
        } else if (i < results.length) {
          status = "completed";
          result = results[i] ?? null;
        } else {
          status = "skipped";
        }

        return {
          index: i,
          node_id: node.id,
          type: node.type,
          params: node.params ?? {},
          status,
          result,
          error,
        };
      });

    const serviceUrl = process.env.SERVICE_URL || "https://cua-service.vercel.app";

    try {
      // Call the service to execute the workflow (blocks until all actions resolve)
      const executeRes = await fetch(`${serviceUrl}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runnerId: runner.id,
          executionId,
          actions,
          payload,
        }),
      });

      const data = await executeRes.json().catch(() => ({}));
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      if (!executeRes.ok) {
        // Partial results may be present up to the failing step
        const results: unknown[] = Array.isArray(data.results) ? data.results : [];
        const failedAt: number =
          typeof data.failedAt === "number" ? data.failedAt : results.length;
        const message: string =
          data.message || data.error || "Execution failed on runner";
        const logs = buildLogs(results, failedAt, message);

        await supabase
          .from("workflow_executions")
          .update({
            status: "failed",
            error: message,
            result: results,
            logs,
            steps_completed: results.length,
            duration_ms: durationMs,
            completed_at: completedAt.toISOString(),
          })
          .eq("id", executionId);

        return NextResponse.json(
          { error: message, executionId, failedAt },
          { status: 502 }
        );
      }

      const results: unknown[] = Array.isArray(data.results) ? data.results : [];
      const logs = buildLogs(results, null, null);

      await supabase
        .from("workflow_executions")
        .update({
          status: "completed",
          result: results,
          logs,
          steps_completed: results.length,
          duration_ms: durationMs,
          completed_at: completedAt.toISOString(),
        })
        .eq("id", executionId);

      return NextResponse.json({
        success: true,
        executionId,
        message: "Workflow executed",
        actionsCount: actions.length,
      });
    } catch (dispatchError) {
      const completedAt = new Date();
      const message =
        dispatchError instanceof Error
          ? dispatchError.message
          : "Failed to dispatch to runner";

      await supabase
        .from("workflow_executions")
        .update({
          status: "failed",
          error: message,
          logs: buildLogs([], 0, message),
          duration_ms: completedAt.getTime() - startedAt.getTime(),
          completed_at: completedAt.toISOString(),
        })
        .eq("id", executionId);

      return NextResponse.json(
        { error: "Failed to dispatch workflow to runner", executionId },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Trigger error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
