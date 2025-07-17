import { NextRequest, NextResponse } from "next/server";
import { getProcessingErrorTypes } from "@/app/actions/processing-history";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fluxId = searchParams.get("fluxId") || "all";
  const result = await getProcessingErrorTypes(fluxId);
  return NextResponse.json(result);
}
