import { NextRequest, NextResponse } from "next/server";
import { getProcessingHistoryById } from "@/app/actions/processing-history";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("processingId") || "0");
  const result = await getProcessingHistoryById(id);
  return NextResponse.json(result);
}
