import { NextRequest, NextResponse } from "next/server";
import { getWorkflowExecutionLogById } from "@/app/actions/workflow-execution-log";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const result = await getWorkflowExecutionLogById(id);
  return NextResponse.json(result);
}
