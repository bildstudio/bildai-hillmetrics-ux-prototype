import { NextRequest, NextResponse } from "next/server";
import { updateReportById } from "@/app/actions/reports";

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");
  if (!idParam) {
    return NextResponse.json(
      { success: false, error: "Missing id" },
      { status: 400 },
    );
  }
  const id = Number(idParam);
  const body = await request.json();
  const result = await updateReportById(id, body);
  return NextResponse.json(result);
}
