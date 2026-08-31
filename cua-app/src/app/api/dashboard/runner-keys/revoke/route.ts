import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const keyId = typeof body.keyId === "string" ? body.keyId : "";
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";

    if (!keyId || !workspaceId) {
      return NextResponse.json(
        { error: "keyId and workspaceId are required" },
        { status: 400 }
      );
    }

    // Verify user is owner of the workspace
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .maybeSingle();

    if (!workspace || workspace.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to manage keys for this workspace" },
        { status: 403 }
      );
    }

    // Verify the key belongs to this workspace
    const admin = createAdminClient();

    const { data: existingKey } = await admin
      .from("runner_keys")
      .select("id, workspace_id")
      .eq("id", keyId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!existingKey) {
      return NextResponse.json(
        { error: "Key not found or does not belong to this workspace" },
        { status: 404 }
      );
    }

    // Delete the key
    const { error: deleteError } = await admin
      .from("runner_keys")
      .delete()
      .eq("id", keyId);

    if (deleteError) {
      console.error("Error revoking key:", deleteError);
      return NextResponse.json(
        { error: "Could not revoke key" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    console.error("Error in revoke API key:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
