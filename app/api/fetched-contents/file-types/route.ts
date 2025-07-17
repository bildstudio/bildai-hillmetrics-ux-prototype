import { NextRequest, NextResponse } from "next/server";
import { getDistinctFileTypes } from "@/app/actions/fetched-contents";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fluxId = searchParams.get("fluxId") || "all";
  const result = await getDistinctFileTypes(fluxId);
  return NextResponse.json(result);
}
