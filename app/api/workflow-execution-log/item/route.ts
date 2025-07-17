import { NextRequest, NextResponse } from "next/server";
import { getWorkflowExecutionLogById } from "@/app/actions/workflow-execution-log";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");
  if (!idParam) {
    return NextResponse.json(
      { data: null, error: { message: "Missing id" } },
      { status: 400 },
    );
  }
  const id = Number(idParam);
  const result = await getWorkflowExecutionLogById(id);
  return NextResponse.json(result);
}
