import { NextRequest, NextResponse } from "next/server";
import { getWorkflowExecutionLogById } from "@/app/actions/workflow-execution-log";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id") || "0");
  const result = await getWorkflowExecutionLogById(id);
  return NextResponse.json(result);
}
