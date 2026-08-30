import { NextResponse, NextRequest } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function DELETE(request: NextRequest) {
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

    // Delete the workflow (RLS will ensure user owns it via workspace)
    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", workflowId);

    if (error) {
      console.error("Error deleting workflow:", error);
      return NextResponse.json(
        { error: "Failed to delete workflow" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete workflow error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
