import { NextRequest, NextResponse } from "next/server";
import { getFetchedContents } from "@/app/actions/fetched-contents";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fluxId = searchParams.get("fluxId") || "all";
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "10");
  const sortColumn = (searchParams.get("sortColumn") || "") as any;
  const sortDirection = (searchParams.get("sortDirection") || "") as any;
  const filtersParam = searchParams.get("filters");
  let filters: any[] = [];
  if (filtersParam) {
    try {
      filters = JSON.parse(filtersParam);
    } catch {}
  }
  const result = await getFetchedContents({
    fluxId,
    page,
    pageSize,
    sortColumn: sortColumn || null,
    sortDirection: sortDirection || null,
    filters,
  });
  return NextResponse.json(result);
}
