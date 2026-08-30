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

    const workspaceId = request.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Verify user owns this workspace
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

    // Fetch workflows for this workspace
    const { data: workflows, error } = await supabase
      .from("workflows")
      .select(`
        id,
        name,
        nodes,
        runner_id,
        published,
        created_at,
        updated_at,
        runners:runner_id (
          id,
          name,
          status
        )
      `)
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching workflows:", error);
      return NextResponse.json(
        { error: "Failed to fetch workflows" },
        { status: 500 }
      );
    }

    return NextResponse.json({ workflows: workflows || [] });
  } catch (error) {
    console.error("List workflows error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
