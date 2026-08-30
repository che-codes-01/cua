import { NextResponse, NextRequest } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflowId = request.nextUrl.searchParams.get("id");

    if (!workflowId) {
      return NextResponse.json(
        { error: "Workflow ID required" },
        { status: 400 }
      );
    }

    // Fetch the workflow (RLS ensures user owns it via workspace)
    const { data: workflow, error } = await supabase
      .from("workflows")
      .select(`
        id,
        workspace_id,
        name,
        nodes,
        runner_id,
        published,
        webhook_key_hash,
        created_at,
        updated_at
      `)
      .eq("id", workflowId)
      .single();

    if (error || !workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("Get workflow error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
