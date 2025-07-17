import { NextRequest, NextResponse } from "next/server";
import { getFetchingTrend } from "@/app/actions/fetching-history";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fluxId = searchParams.get("fluxId") || "all";
  const result = await getFetchingTrend(fluxId);
  return NextResponse.json(result);
}
