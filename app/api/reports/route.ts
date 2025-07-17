import { NextRequest, NextResponse } from "next/server"
import { getReports } from "@/app/actions/reports"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") || "1")
  const pageSize = Number(searchParams.get("pageSize") || "10")
  const sortColumn = searchParams.get("sortColumn")
  const sortDirection = searchParams.get("sortDirection") as "asc" | "desc" | null
  const searchTerm = searchParams.get("q") || ""

  let filters: any[] = []
  const filtersParam = searchParams.get("filters")
  if (filtersParam) {
    try {
      filters = JSON.parse(filtersParam)
    } catch {
      filters = []
    }
  }

  const result = await getReports({
    page,
    pageSize,
    sortColumn,
    sortDirection,
    searchTerm,
    filters,
  })

  return NextResponse.json(result)
}
