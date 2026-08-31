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

    // Get runners from database for this workspace
    const { data: dbRunners, error } = await supabase
      .from("runners")
      .select("id, name, status, labels, last_seen_at")
      .eq("workspace_id", workspaceId);

    if (error) {
      console.error("Error fetching runners:", error);
      return NextResponse.json(
        { error: "Failed to fetch runners" },
        { status: 500 }
      );
    }

    // Get actually connected runners from the service
    const serviceUrl = process.env.SERVICE_URL || "https://cua-service.vercel.app";
    let connectedIds: string[] = [];

    try {
      const serviceRes = await fetch(`${serviceUrl}/api/runners/connected`, {
        cache: "no-store",
      });
      if (serviceRes.ok) {
        const data = await serviceRes.json();
        connectedIds = data.connectedRunnerIds || [];
      }
    } catch (e) {
      console.error("Failed to fetch connected runners from service:", e);
    }

    // Filter to only show runners that are actually connected
    // and update their status based on live connection
    const liveRunners = (dbRunners || []).map((runner) => ({
      ...runner,
      status: connectedIds.includes(runner.id) ? "online" : "offline",
      connected: connectedIds.includes(runner.id),
    }));

    return NextResponse.json({ runners: liveRunners });
  } catch (error) {
    console.error("Live runners error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
