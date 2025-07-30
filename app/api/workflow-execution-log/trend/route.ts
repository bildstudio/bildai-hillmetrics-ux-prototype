import { NextRequest, NextResponse } from "next/server"
import { getMockedWorkflowTrend } from "@/app/actions/workflow-execution-log"

export async function GET(request: NextRequest) {
  const fluxId = request.nextUrl.searchParams.get("fluxId")

  if (!fluxId) {
    return NextResponse.json({ error: "fluxId is required" }, { status: 400 })
  }

  try {
    const data = await getMockedWorkflowTrend(fluxId)
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching workflow trend:", error)
    return NextResponse.json({ error: "Failed to fetch workflow trend" }, { status: 500 })
  }
}