import { NextRequest, NextResponse } from "next/server";
import { handleVisualizerApi } from "@/lib/visualizer/mcp";

export async function GET(request: NextRequest) {
  const result = handleVisualizerApi("GET", request.nextUrl.searchParams);
  if ("error" in result && result.error) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const result = handleVisualizerApi(
    "POST",
    request.nextUrl.searchParams,
    body
  );
  if ("error" in result && result.error) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
