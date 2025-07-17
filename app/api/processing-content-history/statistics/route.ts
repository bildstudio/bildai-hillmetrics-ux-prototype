import { NextRequest, NextResponse } from "next/server";
import { getProcessingStatistics } from "@/app/actions/processing-content-history";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const processingId = Number(searchParams.get("processingId") || "0");
  const result = await getProcessingStatistics(processingId);
  return NextResponse.json(result);
}
