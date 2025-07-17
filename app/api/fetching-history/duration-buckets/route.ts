import { NextRequest, NextResponse } from "next/server";
import { getFetchingDurationBuckets } from "@/app/actions/fetching-history";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fluxId = searchParams.get("fluxId") || "all";
  const result = await getFetchingDurationBuckets(fluxId);
  return NextResponse.json(result);
}
