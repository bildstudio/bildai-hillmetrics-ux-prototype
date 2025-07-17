import { NextRequest, NextResponse } from "next/server";
import { getFluxNames } from "@/app/actions/reports";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids") || "";
  const ids = idsParam
    .split(",")
    .map((v) => Number(v))
    .filter((v) => !isNaN(v));
  const result = await getFluxNames(ids);
  return NextResponse.json(result);
}
