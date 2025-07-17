import { NextRequest, NextResponse } from "next/server";
import { getWorkflowIdByProcessingId, getWorkflowIdByFetchingId } from "@/app/actions/workflow-execution-log";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const processingIdParam = searchParams.get("processingId");
  const fetchingIdParam = searchParams.get("fetchingId");

  if (processingIdParam) {
    const id = Number(processingIdParam);
    const result = await getWorkflowIdByProcessingId(id);
    return NextResponse.json(result);
  }

  if (fetchingIdParam) {
    const id = Number(fetchingIdParam);
    const result = await getWorkflowIdByFetchingId(id);
    return NextResponse.json(result);
  }

  return NextResponse.json({ data: null, error: { message: "Missing id" } }, { status: 400 });
}
