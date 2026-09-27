import { NextResponse, NextRequest } from "next/server";

import { createClient } from "@/utils/supabase/server";

// GET /api/workflows/executions?workspaceId=...&workflowId=...&status=...&limit=...
// Returns recent executions for published workflows in a workspace, newest first.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    const workflowId = request.nextUrl.searchParams.get("workflowId");
    const status = request.nextUrl.searchParams.get("status");
    const limit = Math.min(
      Number(request.nextUrl.searchParams.get("limit")) || 50,
      200
    );

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Verify the user owns this workspace
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Collect the workflow ids that belong to this workspace
    let workflowQuery = supabase
      .from("workflows")
      .select("id, name")
      .eq("workspace_id", workspaceId);

    if (workflowId) workflowQuery = workflowQuery.eq("id", workflowId);

    const { data: workflows, error: wfError } = await workflowQuery;

    if (wfError) {
      console.error("Error fetching workflows:", wfError);
      return NextResponse.json(
        { error: "Failed to fetch workflows" },
        { status: 500 }
      );
    }

    const workflowMap = new Map((workflows || []).map((w) => [w.id, w.name]));
    const workflowIds = [...workflowMap.keys()];

    if (workflowIds.length === 0) {
      return NextResponse.json({ executions: [] });
    }

    // RLS already scopes executions to workflows the owner controls
    let execQuery = supabase
      .from("workflow_executions")
      .select(
        `
        id,
        workflow_id,
        runner_id,
        status,
        trigger_source,
        error,
        steps_total,
        steps_completed,
        duration_ms,
        started_at,
        completed_at,
        runners:runner_id ( id, name, status )
      `
      )
      .in("workflow_id", workflowIds)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") execQuery = execQuery.eq("status", status);

    const { data: executions, error } = await execQuery;

    if (error) {
      console.error("Error fetching executions:", error);
      return NextResponse.json(
        { error: "Failed to fetch executions" },
        { status: 500 }
      );
    }

    const enriched = (executions || []).map((e) => ({
      ...e,
      workflow_name: workflowMap.get(e.workflow_id) ?? "Unknown workflow",
    }));

    return NextResponse.json({ executions: enriched });
  } catch (error) {
    console.error("List executions error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
