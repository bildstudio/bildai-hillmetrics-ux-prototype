import { NextRequest, NextResponse } from "next/server"
import { updateReportById, getReportById } from "@/app/actions/reports"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id)
  if (isNaN(id)) {
    return NextResponse.json(
      { data: null, error: "Invalid report ID" },
      { status: 400 },
    )
  }
  const data = await getReportById(id)
  if (!data) {
    return NextResponse.json(
      { data: null, error: "Report not found" },
      { status: 404 },
    )
  }
  return NextResponse.json({ data, error: null })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const data = await request.json()
  const result = await updateReportById(id, data)
  const status = result.success ? 200 : 500
  return NextResponse.json(result, { status })
}
