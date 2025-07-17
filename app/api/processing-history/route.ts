import { NextRequest, NextResponse } from "next/server";
import { getProcessingHistory, type ProcessingHistoryData } from "@/app/actions/processing-history";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fluxId = searchParams.get("fluxId") || "all";
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "20");
  const sortColumn = (searchParams.get("sortColumn") || "") as keyof ProcessingHistoryData | "";
  const sortDirection = (searchParams.get("sortDirection") || "") as "asc" | "desc" | "";
  const filtersParam = searchParams.get("filters");
  const filters = filtersParam ? JSON.parse(filtersParam) : [];
  const result = await getProcessingHistory({
    fluxId,
    page,
    pageSize,
    sortColumn: sortColumn || null,
    sortDirection: sortDirection || null,
    filters,
  });
  return NextResponse.json(result);
}
