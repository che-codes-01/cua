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

    // Create an execution record
    const executionId = crypto.randomUUID();
    await supabase.from("workflow_executions").insert({
      id: executionId,
      workflow_id: workflowId,
      runner_id: runner.id,
      status: "pending",
      payload,
      started_at: new Date().toISOString(),
    });

    // Build the actions to execute (skip the webhook trigger node)
    const actions = workflow.nodes
      .filter((node: { type: string }) => node.type !== "webhook_trigger")
      .map((node: { type: string; params: Record<string, unknown> }) => ({
        type: node.type,
        ...node.params,
      }));

    // TODO: Send actions to the runner via WebSocket service
    // For now, we'll return the execution info
    // In production, you'd send this to the service which forwards to the runner

    const serviceUrl = process.env.SERVICE_URL || "https://cua-service.vercel.app";
    
    try {
      // Call the service to execute the workflow
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

      if (!executeRes.ok) {
        throw new Error("Failed to dispatch to runner");
      }

      return NextResponse.json({
        success: true,
        executionId,
        message: "Workflow triggered",
        actionsCount: actions.length,
      });
    } catch (dispatchError) {
      // Update execution status
      await supabase
        .from("workflow_executions")
        .update({ status: "failed", error: "Failed to dispatch to runner" })
        .eq("id", executionId);

      return NextResponse.json(
        { 
          error: "Failed to dispatch workflow to runner",
          executionId,
        },
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
