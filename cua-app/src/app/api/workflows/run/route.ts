import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SERVICE_URL =
  process.env.NEXT_PUBLIC_RUNNER_CONNECTOR_URL ?? "http://localhost:3001";

// POST /api/workflows/run
// Executes a single action directly against a connected runner.
// Used by the editor "Test Run" feature to show per-node output.
export async function POST(req: NextRequest) {
  const { runnerId, action } = await req.json();

  if (!runnerId || !action) {
    return NextResponse.json(
      { error: "runnerId and action are required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${SERVICE_URL}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runnerId,
        executionId: crypto.randomUUID(),
        actions: [action],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? data.message ?? "Execution failed", result: null },
        { status: res.status }
      );
    }

    return NextResponse.json({
      result: data.results?.[0] ?? null,
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Service unreachable", result: null },
      { status: 502 }
    );
  }
}
