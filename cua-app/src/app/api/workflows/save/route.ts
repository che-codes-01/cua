import { NextResponse, NextRequest } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workflow } = await request.json();

    if (!workflow || !workflow.id) {
      return NextResponse.json(
        { error: "Invalid workflow data" },
        { status: 400 }
      );
    }

    // Get the workspace for this user
    const { data: workspaces } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1);

    if (!workspaces || workspaces.length === 0) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 404 }
      );
    }

    const workspaceId = workspaces[0].id;

    // Upsert the workflow (without publishing)
    const { error } = await supabase.from("workflows").upsert({
      id: workflow.id,
      workspace_id: workspaceId,
      name: workflow.name,
      nodes: workflow.nodes,
      runner_id: workflow.runnerId || null,
      published: workflow.published || false,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving workflow:", error);
      return NextResponse.json(
        { error: "Failed to save workflow" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
