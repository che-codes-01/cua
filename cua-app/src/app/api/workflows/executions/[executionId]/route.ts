import { NextResponse, NextRequest } from "next/server";

import { createClient } from "@/utils/supabase/server";

// GET /api/workflows/executions/[executionId]
// Returns a single execution with its full step logs, payload and result.
// RLS ensures the execution belongs to a workflow the caller owns.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  try {
    const { executionId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: execution, error } = await supabase
      .from("workflow_executions")
      .select(
        `
        id,
        workflow_id,
        runner_id,
        status,
        trigger_source,
        payload,
        result,
        error,
        logs,
        steps_total,
        steps_completed,
        duration_ms,
        started_at,
        completed_at,
        runners:runner_id ( id, name, status ),
        workflows:workflow_id ( id, name )
      `
      )
      .eq("id", executionId)
      .single();

    if (error || !execution) {
      return NextResponse.json(
        { error: "Execution not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ execution });
  } catch (error) {
    console.error("Get execution error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
