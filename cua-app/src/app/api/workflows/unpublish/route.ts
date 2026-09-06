import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workflowId } = await request.json();
    if (!workflowId) return NextResponse.json({ error: "workflowId required" }, { status: 400 });

    const { error } = await supabase
      .from("workflows")
      .update({ published: false, webhook_key_hash: null, updated_at: new Date().toISOString() })
      .eq("id", workflowId);

    if (error) {
      console.error("Unpublish error:", error);
      return NextResponse.json({ error: "Failed to unpublish" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
