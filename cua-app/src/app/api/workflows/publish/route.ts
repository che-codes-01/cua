import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto";

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

    const { workflow, workspaceId: providedWorkspaceId } = await request.json();

    if (!workflow || !workflow.id || !workflow.runnerId) {
      return NextResponse.json(
        { error: "Invalid workflow data" },
        { status: 400 }
      );
    }

    // Generate a secure webhook key
    const webhookKey = `whk_${crypto.randomBytes(24).toString("hex")}`;
    const webhookKeyHash = crypto
      .createHash("sha256")
      .update(webhookKey)
      .digest("hex");

    // Use provided workspaceId or get the first workspace for this user
    let workspaceId = providedWorkspaceId;
    
    if (!workspaceId) {
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
      workspaceId = workspaces[0].id;
    }

    // Upsert the workflow
    const { error } = await supabase.from("workflows").upsert({
      id: workflow.id,
      workspace_id: workspaceId,
      name: workflow.name,
      nodes: workflow.nodes,
      runner_id: workflow.runnerId,
      webhook_key_hash: webhookKeyHash,
      published: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving workflow:", error);
      return NextResponse.json(
        { error: "Failed to publish workflow" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      webhookKey, // Return the plain key only once
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
