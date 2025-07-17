import { NextRequest, NextResponse } from "next/server";
import { getFetchingStatusCounts } from "@/app/actions/fetching-history";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fluxId = searchParams.get("fluxId") || "all";
  const result = await getFetchingStatusCounts(fluxId);
  return NextResponse.json(result);
}
