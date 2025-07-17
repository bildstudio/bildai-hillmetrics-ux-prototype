import { NextRequest, NextResponse } from "next/server";
import { getWorkflowExecutionLog } from "@/app/actions/workflow-execution-log";
import type { WorkflowExecutionLogData } from "@/app/actions/workflow-execution-log";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fluxId = searchParams.get("fluxId") || "all";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "25");
  const sortColumn = (searchParams.get("sortColumn") as keyof WorkflowExecutionLogData | null) ?? null;
  const sortDirection = (searchParams.get("sortDirection") as "asc" | "desc" | null) ?? null;
  const filtersParam = searchParams.get("filters");
  let filters: { field: string; operator: string; value: any }[] = [];
  if (filtersParam) {
    try {
      filters = JSON.parse(filtersParam);
    } catch {}
  }

  const result = await getWorkflowExecutionLog({
    fluxId,
    page,
    pageSize,
    sortColumn,
    sortDirection,
    filters,
  });

  return NextResponse.json(result);
}
