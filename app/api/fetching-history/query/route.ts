import { NextRequest, NextResponse } from "next/server";
import { getFetchingHistory, getProcessingCounts } from "@/app/actions/fetching-history";
import { getFluxNames } from "@/app/actions/reports";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    fluxId,
    page,
    pageSize,
    sortColumn,
    sortDirection,
    filters,
    showFluxId
  } = body;

  const result = await getFetchingHistory({
    fluxId,
    page,
    pageSize,
    sortColumn,
    sortDirection,
    filters,
  });

  if (result.error) {
    return NextResponse.json(result);
  }

  const ids = result.data.map((d) => d.fetchingID);
  const { data: counts } = await getProcessingCounts(ids);

  const withCounts = result.data.map((item) => ({
    ...item,
    processingsCount:
      counts && counts[item.fetchingID] ? [{ count: counts[item.fetchingID] }] : null,
  }));

  let fluxNames: Record<number, string> = {};
  if (showFluxId) {
    const fluxIds = Array.from(new Set(result.data.map((d) => d.fluxID)));
    const { data: names } = await getFluxNames(fluxIds);
    fluxNames = names;
  }

  return NextResponse.json({
    data: withCounts,
    totalCount: result.totalCount,
    error: null,
    fluxNames,
  });
}
