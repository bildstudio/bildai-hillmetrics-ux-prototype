import { type NextRequest, NextResponse } from "next/server";
import { getWorkflowStageStatuses } from "@/app/actions/workflow-stage-statuses";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fetchingId = searchParams.get("fetchingId");
  const processingId = searchParams.get("processingId");
  const normalizationId = searchParams.get("normalizationId");
  const refinementId = searchParams.get("refinementId");
  const calculationId = searchParams.get("calculationId");

  const result = await getWorkflowStageStatuses({
    fetchingId: fetchingId ? Number(fetchingId) : undefined,
    processingId: processingId ? Number(processingId) : undefined,
    normalizationId: normalizationId ? Number(normalizationId) : undefined,
    refinementId: refinementId ? Number(refinementId) : undefined,
    calculationId: calculationId ? Number(calculationId) : undefined,
  });

  return NextResponse.json(result);
}
