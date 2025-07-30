import { NextRequest, NextResponse } from "next/server";
import { getWorkflowExecutionStatusCounts } from "@/app/actions/workflow-execution-log";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fluxId = searchParams.get("fluxId") || "all";
  const result = await getWorkflowExecutionStatusCounts(fluxId);
  return NextResponse.json(result);
}