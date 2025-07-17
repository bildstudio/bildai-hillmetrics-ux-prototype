import { NextRequest, NextResponse } from "next/server"
import { getActivities } from "@/app/actions/activity"

function decodeFilters(encoded: string | null) {
  if (!encoded) return []
  try {
    return JSON.parse(
      decodeURIComponent(Buffer.from(encoded, "base64").toString("utf8")),
    )
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fluxId = searchParams.get("fluxId") || "all";
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "20");
  const filters = decodeFilters(searchParams.get("filters"));
  const result = await getActivities({ fluxId, page, pageSize, filters });
  return NextResponse.json(result);
}
