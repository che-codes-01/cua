import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { generateRunnerKey } from "@/lib/runner-keys";

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

    const admin = createAdminClient();

    // Verify the key belongs to this workspace and get its name
    const { data: existingKey } = await admin
      .from("runner_keys")
      .select("id, workspace_id, name")
      .eq("id", keyId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!existingKey) {
      return NextResponse.json(
        { error: "Key not found or does not belong to this workspace" },
        { status: 404 }
      );
    }

    // Generate new key credentials
    const { key, hash, prefix } = generateRunnerKey();

    // Update the key with new hash and prefix
    const { data: updatedKey, error: updateError } = await admin
      .from("runner_keys")
      .update({
        key_hash: hash,
        key_prefix: prefix,
      })
      .eq("id", keyId)
      .select("id, key_prefix, name, created_at")
      .single();

    if (updateError) {
      console.error("Error rotating key:", updateError.message, updateError.details, updateError.hint);
      return NextResponse.json(
        { error: "Could not rotate key: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key rotated successfully",
      key: {
        id: updatedKey.id,
        name: updatedKey.name,
        key_prefix: updatedKey.key_prefix,
        created_at: updatedKey.created_at,
        // Return the full key only once after rotation
        // The user must save it as it won't be shown again
        newKey: key,
      },
    });
  } catch (error) {
    console.error("Error in rotate API key:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
