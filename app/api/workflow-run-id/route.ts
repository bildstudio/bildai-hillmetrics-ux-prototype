import { NextRequest, NextResponse } from "next/server";
import { getRunIdFromStage } from "@/app/actions/workflow-run-id";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stageId = Number(searchParams.get("stageId") || "0");
  const stageType = searchParams.get("stageType") || "";
  const result = await getRunIdFromStage(stageId, stageType);
  return NextResponse.json(result);
}
