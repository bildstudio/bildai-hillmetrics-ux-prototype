import { NextRequest, NextResponse } from "next/server";
import { getProcessingDurationBuckets } from "@/app/actions/processing-history";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fluxId = searchParams.get("fluxId") || "all";
  const result = await getProcessingDurationBuckets(fluxId);
  return NextResponse.json(result);
}
