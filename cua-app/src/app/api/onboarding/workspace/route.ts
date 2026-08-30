import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { generateRunnerKey } from "@/lib/runner-keys";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

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

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const runnerConnectionName =
      typeof body.runnerConnectionName === "string"
        ? body.runnerConnectionName.trim()
        : "Production";

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        {
          error:
            "Workspace name must be between 2 and 80 characters.",
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const baseSlug = slugify(name);

    let slug = baseSlug;
    let attempt = 0;

    while (true) {
      const { data: existing } = await admin
        .from("workspaces")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!existing) break;

      attempt++;

      slug = `${baseSlug}-${attempt}`;
    }

    const { data: workspace, error: workspaceError } =
      await admin
        .from("workspaces")
        .insert({
          name,
          slug,
          owner_id: user.id,
        })
        .select()
        .single();

    if (workspaceError) {
      console.error(workspaceError);

      return NextResponse.json(
        { error: "Could not create workspace." },
        { status: 500 }
      );
    }

    // Note: workspace_members is populated automatically by the
    // on_workspace_created trigger – no manual insert needed here.

    const { key, hash, prefix } = generateRunnerKey();

    const { data: runnerKey, error: keyError } =
      await admin
        .from("runner_keys")
        .insert({
          workspace_id: workspace.id,
          name: runnerConnectionName || "Production",
          key_hash: hash,
          key_prefix: prefix,
        })
        .select()
        .single();

    if (keyError) {
      await admin
        .from("workspaces")
        .delete()
        .eq("id", workspace.id);

      console.error(keyError);

      return NextResponse.json(
        { error: "Could not create runner connection." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },

      runnerConnection: {
        id: runnerKey.id,
        name: runnerKey.name,
        key: key,
        prefix: prefix,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
