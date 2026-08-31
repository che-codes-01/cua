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

    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
    const name = typeof body.name === "string" ? body.name.trim() : "API Key";

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    if (name.length < 1 || name.length > 80) {
      return NextResponse.json(
        { error: "Key name must be between 1 and 80 characters" },
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

    // Generate new key credentials
    const { key, hash, prefix } = generateRunnerKey();

    // Create the new key
    const { data: newKey, error: createError } = await admin
      .from("runner_keys")
      .insert({
        workspace_id: workspaceId,
        name,
        key_hash: hash,
        key_prefix: prefix,
      })
      .select("id, key_prefix, name, created_at")
      .single();

    if (createError) {
      console.error("Error creating key:", createError.message, createError.details, createError.hint);
      return NextResponse.json(
        { error: "Could not create key: " + createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key created successfully",
      key: {
        id: newKey.id,
        name: newKey.name,
        key_prefix: newKey.key_prefix,
        created_at: newKey.created_at,
        // Return the full key only once after creation
        // The user must save it as it won't be shown again
        newKey: key,
      },
    });
  } catch (error) {
    console.error("Error in create API key:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
