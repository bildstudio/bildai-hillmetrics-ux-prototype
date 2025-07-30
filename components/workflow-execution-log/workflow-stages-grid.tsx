"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HorizontalScroller } from "@/components/horizontal-scroller"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  MoreVertical,
  FileTextIcon,
  Loader2,
  Columns3,
  Bookmark,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
} from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import ColumnsPanel from "@/components/shared/ColumnsPanel"
import TableColumnHeader from "@/components/table-column-header"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createPortal } from "react-dom"
import type { WorkflowStageDetailData } from "@/app/actions/workflow-stage-details"
import { getWorkflowStageDetails } from "@/app/actions/workflow-stage-details"
import { WorkflowStageMenuItems, type WorkflowStageMenuAction } from "./workflow-stages-menu-items"
import { useBladeStack } from "@/lib/blade-stack-context"
import { format, parseISO } from "date-fns"
import { WORKFLOW_STAGE_ORDER, sortWorkflowStages } from "@/lib/workflow-stage-order"
import { commonStatusMap } from "@/lib/status-config"

type SortDirection = "asc" | "desc" | null

interface Column {
  key: keyof WorkflowStageDetailData | "view"
  label: string
  hidden?: boolean
  pinned?: "left" | "right"
}

interface SavedFilter {
  id: string
  name: string
  filters: AppliedFilter[]
  createdAt: string
}

interface FilterField {
  key: string
  label: string
  type: string
}

interface AppliedFilter {
  id: string
  field: string
  operator: string
  value: any
  label: string
}

const progressOptions = [
  { label: "0% - 25%", min: 0, max: 25 },
  { label: "26% - 50%", min: 26, max: 50 },
  { label: "51% - 75%", min: 51, max: 75 },
  { label: "76% - 100%", min: 76, max: 100 },
]

const durationOptions = [
  { label: "0-1 min", min: 0, max: 1 },
  { label: "1-2 min", min: 1, max: 2 },
  { label: "2-5 min", min: 2, max: 5 },
  { label: "5-10 min", min: 5, max: 10 },
  { label: "10+ min", min: 10, max: null },
]

const timeRangeOptions = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "last7days" },
  { label: "Last 30 days", value: "last30days" },
  { label: "Custom date range", value: "custom" },
]

export const WorkflowStagesGrid: React.FC<{
  runId: number
  fluxId?: number
  fluxName?: string
  onViewFetching?: (id: number) => void
  onViewProcessing?: (id: number) => void
  onViewNormalization?: (id: number) => void
  onViewRefinement?: (id: number) => void
  onViewCalculation?: (id: number) => void
}> = ({
  runId,
  fluxId,
  fluxName,
  onViewFetching,
  onViewProcessing,
  onViewNormalization,
  onViewRefinement,
  onViewCalculation,
}) => {
  const { openBlade, closeTopBlade } = useBladeStack()
  const [data, setData] = useState<WorkflowStageDetailData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortColumn, setSortColumn] = useState<keyof WorkflowStageDetailData | null>("stage_started")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [columns, setColumns] = useState<Column[]>([
    { key: "id", label: "ID" },
    { key: "stage_type", label: "Stage Type" },
    { key: "status", label: "Status" },
    { key: "stage_started", label: "Stage Started" },
    { key: "stage_end", label: "Stage End" },
    { key: "sub_process_count", label: "Sub process count" },
    { key: "duration_seconds", label: "Duration (min)" },
    { key: "progress", label: "Progress" },
    { key: "error_message", label: "Error Message" },
    { key: "view", label: "" },
  ])
  const pageSizeOptions = [10, 20, 50]

  useEffect(() => {
    const checkScreen = () => {
      if (typeof window !== "undefined") {
        setIsLargeScreen(window.innerWidth >= 1600)
      }
    }
    checkScreen()
    window.addEventListener("resize", checkScreen)
    return () => window.removeEventListener("resize", checkScreen)
  }, [])

  const [showColumnsPanel, setShowColumnsPanel] = useState(false)

  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([])
  const [showSavedFiltersPanel, setShowSavedFiltersPanel] = useState(false)
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [filterNameInput, setFilterNameInput] = useState("")
  const [hoveredFilterId, setHoveredFilterId] = useState<string | null>(null)
  const [showAddFilterPanel, setShowAddFilterPanel] = useState(false)
  const [selectedFilterField, setSelectedFilterField] = useState<FilterField | null>(null)
  const [showSpecificFilterPanel, setShowSpecificFilterPanel] = useState(false)
  const [editingFilter, setEditingFilter] = useState<AppliedFilter | null>(null)

  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null)
  const [openDropdownRowId, setOpenDropdownRowId] = useState<number | null>(null)
  const [openContextMenuRowId, setOpenContextMenuRowId] = useState<number | null>(null)
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  const [stageTypeInput, setStageTypeInput] = useState("")
  const [selectedProgressRanges, setSelectedProgressRanges] = useState<string[]>([])
  const [selectedDurationRanges, setSelectedDurationRanges] = useState<string[]>([])
  const [selectedStartTimeRange, setSelectedStartTimeRange] = useState("")
  const [selectedEndTimeRange, setSelectedEndTimeRange] = useState("")
  const [startTimeAfter, setStartTimeAfter] = useState("")
  const [startTimeBefore, setStartTimeBefore] = useState("")
  const [endTimeAfter, setEndTimeAfter] = useState("")
  const [endTimeBefore, setEndTimeBefore] = useState("")
  const [textInputValue, setTextInputValue] = useState("")

  const availableFilterFields: FilterField[] = [
    { key: "stage_type", label: "Stage Type", type: "text" },
    { key: "progress", label: "Progress", type: "progress" },
    { key: "duration_seconds", label: "Duration", type: "duration" },
    { key: "stage_started", label: "Stage Started", type: "timerange" },
    { key: "stage_end", label: "Stage End", type: "timerange" },
    { key: "error_message", label: "Error", type: "text" },
  ]

  const [allData, setAllData] = useState<WorkflowStageDetailData[]>([])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const { data: rows } = await getWorkflowStageDetails(runId)
    setAllData(sortWorkflowStages(rows || []))
    setIsLoading(false)
  }, [runId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const stored = localStorage.getItem("workflow-stages-saved-filters")
    if (stored) {
      try {
        setSavedFilters(JSON.parse(stored))
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      "workflow-stages-saved-filters",
      JSON.stringify(savedFilters),
    )
  }, [savedFilters])

  useEffect(() => {
    setCurrentPage(1)
  }, [runId])

  useEffect(() => {
    setSortColumn("stage_started")
    setSortDirection("asc")
  }, [runId])

  useEffect(() => {
    let filtered = [...allData]

    for (const filter of appliedFilters) {
      switch (filter.field) {
        case "stage_type":
          filtered = filtered.filter((r) =>
            (filter.value as string[]).some((v) => r.stage_type.toLowerCase().includes(v.toLowerCase())),
          )
          break
        case "progress":
          filtered = filtered.filter((r) => {
            const val = r.progress ?? 0
            return (filter.value as string[]).some((label) => {
              const opt = progressOptions.find((o) => o.label === label)
              if (!opt) return false
              return val >= opt.min && (opt.max === null || val <= opt.max)
            })
          })
          break
        case "duration_seconds":
          filtered = filtered.filter((r) => {
            const val = (r.duration_seconds ?? 0) / 60  // Convert seconds to minutes
            return (filter.value as string[]).some((label) => {
              const opt = durationOptions.find((o) => o.label === label)
              if (!opt) return false
              if (opt.max === null) return val >= opt.min
              return val >= opt.min && val <= opt.max
            })
          })
          break
        case "stage_started":
        case "stage_end":
          filtered = filtered.filter((r) => {
            const dateStr = r[filter.field] as string | null
            if (!dateStr) return false
            const date = new Date(dateStr)
            if (filter.operator === "date_range") {
              return (
                date >= new Date(filter.value.start) &&
                date <= new Date(filter.value.end)
              )
            } else if (filter.operator === "custom_date_range") {
              const after = filter.value.after ? new Date(filter.value.after) : null
              const before = filter.value.before ? new Date(filter.value.before) : null
              if (after && date < after) return false
              if (before && date > before) return false
              return true
            }
            return true
          })
          break
        case "error_message":
          filtered = filtered.filter((r) =>
            r.error_message?.toLowerCase().includes((filter.value as string).toLowerCase()),
          )
          break
        default:
          break
      }
    }

    let sorted = [...filtered]
    if (sortColumn) {
      sorted.sort((a, b) => {
        if (sortColumn === "stage_type") {
          const av =
            typeof a.stage_order === "number"
              ? a.stage_order
              : WORKFLOW_STAGE_ORDER[(a.stage_type || "").toLowerCase()] ?? Infinity
          const bv =
            typeof b.stage_order === "number"
              ? b.stage_order
              : WORKFLOW_STAGE_ORDER[(b.stage_type || "").toLowerCase()] ?? Infinity
          if (av === bv) return 0
          return sortDirection === "desc" ? bv - av : av - bv
        }
        const av = (a as any)[sortColumn]
        const bv = (b as any)[sortColumn]
        if (av === bv) return 0
        if (sortDirection === "desc") return av > bv ? -1 : 1
        return av > bv ? 1 : -1
      })
    }
    setTotalPages(Math.max(1, Math.ceil(sorted.length / pageSize)))
    setTotalCount(sorted.length)
    const start = (currentPage - 1) * pageSize
    setData(sorted.slice(start, start + pageSize))
  }, [allData, appliedFilters, sortColumn, sortDirection, currentPage, pageSize])

  const handleSort = (column: keyof WorkflowStageDetailData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleSortAsc = (column: keyof WorkflowStageDetailData | "view") => {
    if (column === "view") return
    setSortColumn(column)
    setSortDirection("asc")
    setCurrentPage(1)
  }

  const handleSortDesc = (column: keyof WorkflowStageDetailData | "view") => {
    if (column === "view") return
    setSortColumn(column)
    setSortDirection("desc")
    setCurrentPage(1)
  }

  const hideColumn = (key: keyof WorkflowStageDetailData | "view") => {
    setColumns((cols) => cols.map((c) => (c.key === key ? { ...c, hidden: true } : c)))
  }

  const openFilterForColumn = (key: keyof WorkflowStageDetailData | "view") => {
    const field = availableFilterFields.find((f) => f.key === key)
    if (!field) return
    handleSelectFilterField(field)
    setShowAddFilterPanel(false)
  }

  const pinColumn = (key: keyof WorkflowStageDetailData | "view", side: "left" | "right") => {
    setColumns((cols) => cols.map((c) => (c.key === key ? { ...c, pinned: side } : c)))
  }

  const unpinColumn = (key: keyof WorkflowStageDetailData | "view") => {
    setColumns((cols) => cols.map((c) => (c.key === key ? { ...c, pinned: undefined } : c)))
  }

  const getSortIcon = (columnKey: keyof WorkflowStageDetailData | "view") => {
    if (sortColumn === columnKey) {
      return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
    }
    return <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
  }

  const goToPage = useCallback(
    (page: number) => {
      const p = Math.min(Math.max(page, 1), totalPages)
      setCurrentPage(p)
    },
    [totalPages],
  )

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage((p) => p - 1)
  }, [currentPage])

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1)
  }, [currentPage, totalPages])

  const getOrderedColumns = useCallback(() => {
    return columns
      .filter((c) => !c.hidden)
      .sort((a, b) => {
        const order = (col: Column) =>
          col.pinned === "left" ? 0 : col.pinned === "right" ? 2 : 1
        const diff = order(a) - order(b)
        if (diff !== 0) return diff
        return columns.indexOf(a) - columns.indexOf(b)
      })
  }, [columns])

  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    const ordered = getOrderedColumns()
    const [moved] = ordered.splice(result.source.index, 1)
    ordered.splice(result.destination.index, 0, moved)
    const newCols: Column[] = []
    let vIndex = 0
    for (const col of columns) {
      if (col.hidden) newCols.push(col)
      else newCols.push(ordered[vIndex++])
    }
    setColumns(newCols)
  }

  const getDateRangeForTimeOption = (option: string) => {
    const now = new Date()
    switch (option) {
      case "today":
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date(now.setHours(23, 59, 59, 999)) }
      case "last7days":
        return { start: new Date(now.getTime() - 7 * 86400000), end: new Date() }
      case "last30days":
        return { start: new Date(now.getTime() - 30 * 86400000), end: new Date() }
      default:
        return null
    }
  }

  const handleSelectFilterField = (field: FilterField) => {
    setSelectedFilterField(field)
    setShowSpecificFilterPanel(true)
    setStageTypeInput("")
    setSelectedProgressRanges([])
    setSelectedDurationRanges([])
    setSelectedStartTimeRange("")
    setSelectedEndTimeRange("")
    setStartTimeAfter("")
    setStartTimeBefore("")
    setEndTimeAfter("")
    setEndTimeBefore("")
    setTextInputValue("")
  }

  const handleApplySpecificFilter = () => {
    if (!selectedFilterField) return

    let filterValue: any
    let operator: string
    let label: string

    switch (selectedFilterField.type) {
      case "text":
        if (!textInputValue.trim()) return
        filterValue = [textInputValue.trim()]
        operator = "in"
        label = `${selectedFilterField.label}: ${textInputValue.trim()}`
        break
      case "progress":
        if (selectedProgressRanges.length === 0) return
        filterValue = selectedProgressRanges
        operator = "progress_ranges"
        label = `Progress: ${selectedProgressRanges.join(", ")}`
        break
      case "duration":
        if (selectedDurationRanges.length === 0) return
        filterValue = selectedDurationRanges
        operator = "duration_ranges"
        label = `Duration: ${selectedDurationRanges.join(", ")}`
        break
      case "timerange":
        const isStart = selectedFilterField.key === "stage_started"
        const range = isStart ? selectedStartTimeRange : selectedEndTimeRange
        const after = isStart ? startTimeAfter : endTimeAfter
        const before = isStart ? startTimeBefore : endTimeBefore
        if (!range) return
        if (range === "custom") {
          if (!after && !before) return
          filterValue = { after, before }
          operator = "custom_date_range"
          label = `${selectedFilterField.label}: Custom`
        } else {
          const dr = getDateRangeForTimeOption(range)
          if (!dr) return
          filterValue = dr
          operator = "date_range"
          const l = timeRangeOptions.find((o) => o.value === range)?.label || range
          label = `${selectedFilterField.label}: ${l}`
        }
        break
      default:
        return
    }

    if (editingFilter) {
      setAppliedFilters((prev) =>
        prev.map((f) => (f.id === editingFilter.id ? { ...f, operator, value: filterValue, label } : f)),
      )
    } else {
      const newFilter: AppliedFilter = {
        id: Date.now().toString(),
        field: selectedFilterField.key,
        operator,
        value: filterValue,
        label,
      }
      setAppliedFilters((prev) => [...prev, newFilter])
    }

    setShowSpecificFilterPanel(false)
    setShowAddFilterPanel(false)
    setSelectedFilterField(null)
    setEditingFilter(null)
    setCurrentPage(1)
  }

  const handleBackToFilterList = () => {
    setShowSpecificFilterPanel(false)
    setSelectedFilterField(null)
  }

  const handleEditFilter = (filter: AppliedFilter) => {
    const field = availableFilterFields.find((f) => f.key === filter.field)
    if (!field) return
    setSelectedFilterField(field)
    setEditingFilter(filter)
    switch (field.type) {
      case "text":
        setTextInputValue(String((filter.value as string[])?.[0] || ""))
        break
      case "progress":
        setSelectedProgressRanges(Array.isArray(filter.value) ? filter.value : [])
        break
      case "duration":
        setSelectedDurationRanges(Array.isArray(filter.value) ? filter.value : [])
        break
      case "timerange":
        const isStart = field.key === "stage_started"
        if (filter.operator === "custom_date_range") {
          if (isStart) {
            setSelectedStartTimeRange("custom")
            setStartTimeAfter(filter.value.after || "")
            setStartTimeBefore(filter.value.before || "")
          } else {
            setSelectedEndTimeRange("custom")
            setEndTimeAfter(filter.value.after || "")
            setEndTimeBefore(filter.value.before || "")
          }
        } else {
          const opt = timeRangeOptions.find((o) => {
            if (o.value === "custom") return false
            const dr = getDateRangeForTimeOption(o.value)
            return dr && JSON.stringify(dr) === JSON.stringify(filter.value)
          })
          if (isStart) setSelectedStartTimeRange(opt?.value || "")
          else setSelectedEndTimeRange(opt?.value || "")
        }
        break
    }
    setShowSpecificFilterPanel(true)
    setShowAddFilterPanel(false)
  }

  const handleRemoveFilter = (id: string) => {
    setAppliedFilters((prev) => prev.filter((f) => f.id !== id))
  }

  const handleSaveFilter = () => {
    if (!filterNameInput.trim()) return
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterNameInput.trim(),
      filters: appliedFilters,
      createdAt: new Date().toISOString(),
    }
    setSavedFilters((prev) => [...prev, newFilter])
    setFilterNameInput("")
  }

  const handleDeleteFilter = (id: string) => {
    setSavedFilters((prev) => prev.filter((f) => f.id !== id))
  }

  const handleApplySavedFilter = (f: SavedFilter) => {
    setAppliedFilters(f.filters)
    setShowSavedFiltersPanel(false)
    setCurrentPage(1)
  }

  const isFilterFieldApplied = (key: string) => appliedFilters.some((f) => f.field === key)

  const renderSpecificFilterContent = () => {
    if (!selectedFilterField) return null

    switch (selectedFilterField.type) {
      case "text":
        return (
          <Input
            type="text"
            placeholder={`Enter ${selectedFilterField.label}`}
            value={textInputValue}
            onChange={(e) => setTextInputValue(e.target.value)}
          />
        )
      case "progress":
        return (
          <div className="space-y-2">
            {progressOptions.map((range) => (
              <div key={range.label} className="flex items-center gap-2">
                <Checkbox
                  id={`progress-${range.label}`}
                  checked={selectedProgressRanges.includes(range.label)}
                  onCheckedChange={() =>
                    setSelectedProgressRanges((prev) =>
                      prev.includes(range.label)
                        ? prev.filter((r) => r !== range.label)
                        : [...prev, range.label],
                    )
                  }
                />
                <label htmlFor={`progress-${range.label}`}>{range.label}</label>
              </div>
            ))}
          </div>
        )
      case "duration":
        return (
          <div className="space-y-2">
            {durationOptions.map((range) => (
              <div key={range.label} className="flex items-center gap-2">
                <Checkbox
                  id={`duration-${range.label}`}
                  checked={selectedDurationRanges.includes(range.label)}
                  onCheckedChange={() =>
                    setSelectedDurationRanges((prev) =>
                      prev.includes(range.label)
                        ? prev.filter((r) => r !== range.label)
                        : [...prev, range.label],
                    )
                  }
                />
                <label htmlFor={`duration-${range.label}`}>{range.label}</label>
              </div>
            ))}
          </div>
        )
      case "timerange":
        const isStart = selectedFilterField.key === "stage_started"
        const selectedRange = isStart ? selectedStartTimeRange : selectedEndTimeRange
        const setSelectedRange = isStart ? setSelectedStartTimeRange : setSelectedEndTimeRange
        const afterDate = isStart ? startTimeAfter : endTimeAfter
        const beforeDate = isStart ? startTimeBefore : endTimeBefore
        const setAfterDate = isStart ? setStartTimeAfter : setEndTimeAfter
        const setBeforeDate = isStart ? setStartTimeBefore : setEndTimeBefore

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {timeRangeOptions.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`time-${opt.value}`}
                    checked={selectedRange === opt.value}
                    onCheckedChange={() =>
                      setSelectedRange(selectedRange === opt.value ? "" : opt.value)
                    }
                  />
                  <label htmlFor={`time-${opt.value}`}>{opt.label}</label>
                </div>
              ))}
            </div>
            {selectedRange === "custom" && (
              <div className="space-y-2 pl-6">
                <div>
                  <label className="text-sm font-medium">After:</label>
                  <Input type="date" value={afterDate} onChange={(e) => setAfterDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Before:</label>
                  <Input type="date" value={beforeDate} onChange={(e) => setBeforeDate(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  const router = useRouter()

  const handleView = (row: WorkflowStageDetailData) => {
    const id = row.id
    const type = row.stage_type.toLowerCase()
    const label = fluxName ?? `Flux ${fluxId ?? id}`
    const fid = String(fluxId ?? "")

    const open = (
      loader: () => Promise<{ default: React.ComponentType<any> }>,
      props: Record<string, any>,
    ) => openBlade(loader, { ...props, onClose: closeTopBlade }, label)

    if (type.includes("fetch")) {
      if (onViewFetching) onViewFetching(id)
      else open(() => import("@/components/fetching-history/fetching-history-details-blade"), { fetchingId: id, fluxName: label, fluxId: fid })
    } else if (type.includes("process")) {
      if (onViewProcessing) onViewProcessing(id)
      else open(() => import("@/components/processing-history/processing-history-details-blade"), { processingId: id, fluxName: label, fluxId: fid })
    } else if (type.includes("norm")) {
      if (onViewNormalization) onViewNormalization(id)
      else open(() => import("@/components/normalization-history/NormalizationDetailsBlade"), { normalizationId: id, fluxName: label, fluxId: fid })
    } else if (type.includes("refin")) {
      if (onViewRefinement) onViewRefinement(id)
      else open(() => import("@/components/refinement-history/RefinementDetailsBlade"), { refinementId: id, fluxName: label, fluxId: fid })
    } else if (type.includes("calc")) {
      if (onViewCalculation) onViewCalculation(id)
      else open(() => import("@/components/calculation-history/CalculationDetailsBlade"), { calculationId: id, fluxName: label, fluxId: fid })
    }
  }

  const handleMenuAction = (action: WorkflowStageMenuAction, row: WorkflowStageDetailData) => {
    if (action === "view") handleView(row)
  }

  const renderCell = (item: WorkflowStageDetailData, key: keyof WorkflowStageDetailData | "view") => {
    const value = item[key as keyof WorkflowStageDetailData]
    switch (key) {
      case "id":
        return (
          <Badge
            className="bg-black text-white hover:bg-gray-300 cursor-pointer rounded-full px-2"
            onClick={() => handleView(item)}
          >
            {item.id}
          </Badge>
        )
      case "status":
        const statusConfig = commonStatusMap[item.status]
        if (statusConfig) {
          const IconComponent = statusConfig.icon
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center">
                    <IconComponent className={cn("h-5 w-5", statusConfig.colorClass)} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{statusConfig.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }
        const stLower = String(item.status).toLowerCase()
        if (stLower.includes("currently") || stLower.includes("in progress") || stLower.includes("progress")) {
          const type = String(item.stage_type || "").toLowerCase()
          const color = type.includes("process") ? "text-orange-500" : "text-blue-500"
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center">
                    <RefreshCw className={cn("h-5 w-5 animate-spin", color)} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.status}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }
        return <span className="text-sm">{item.status}</span>
      case "stage_started":
      case "stage_end":
        return value ? format(parseISO(value as string), "yyyy-MM-dd HH:mm") : "–"
      case "progress":
        return value !== null && value !== undefined ? (
          <div className="flex items-center gap-2">
            <Progress
              value={Number(value)}
              className="w-[60%]"
              indicatorColor="black"
            />
            <span className="text-sm text-gray-600">{value}%</span>
          </div>
        ) : (
          "–"
        )
      case "view":
        return (
          <div className="flex items-center justify-end space-x-1 pr-2">
            {isLargeScreen && (hoveredRowId === item.id || openDropdownRowId === item.id) && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                        onClick={() => handleView(item)}
                      >
                        <FileTextIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
            <DropdownMenu onOpenChange={(o) => setOpenDropdownRowId(o ? item.id : null)}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40" align="end">
                <WorkflowStageMenuItems
                  item={item}
                  onAction={(action) => handleMenuAction(action, item)}
                  components={{ Item: DropdownMenuItem, Separator: DropdownMenuItem }}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      case "duration_seconds":
        if (value === null || value === undefined) return "–"
        return `${Math.round((value as number) / 60)} min`
      default:
        return String(value ?? "–")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5499a2]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <HorizontalScroller>
          <div className="flex items-center space-x-2 py-1">
            <Button variant="outline" onClick={() => setShowSavedFiltersPanel(true)} className="h-9 px-3">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved Filters
            </Button>
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            {appliedFilters.map((filter) => (
              <Button
                key={filter.id}
                variant="outline"
                className="h-9 text-sm px-3 py-2 bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200 flex-shrink-0 group"
                onClick={() => handleEditFilter(filter)}
              >
                <span className="mr-1.5 whitespace-nowrap">{filter.label}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 ml-1 -mr-1 text-blue-700 hover:text-blue-900 hover:bg-blue-100/50 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFilter(filter.id)
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                setShowAddFilterPanel(true)
                setEditingFilter(null)
              }}
              className="h-9 px-3 border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add filter
            </Button>
            {appliedFilters.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => setAppliedFilters([])}
                className="h-9 px-3 text-[#5499a2]"
              >
                Clear filters
              </Button>
            )}
          </div>
        </HorizontalScroller>
        <div className="flex items-center space-x-2 text-sm text-[#505050]">
          <span>
            {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-[#f0f9fa] hover:text-[#3d7a82] transition-all duration-200"
            disabled={currentPage === 1}
            onClick={goToPreviousPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-[#f0f9fa] hover:text-[#3d7a82] transition-all duration-200"
            disabled={currentPage === totalPages}
            onClick={goToNextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-[#f0f9fa] hover:text-[#3d7a82] transition-all duration-200"
            onClick={() => setShowColumnsPanel(true)}
            aria-label="Manage columns"
          >
            <Columns3 className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader>
                  <Droppable droppableId="columns-workflow-stages" direction="horizontal">
                    {(provided) => (
                      <TableRow ref={provided.innerRef} {...provided.droppableProps}>
                        {getOrderedColumns().map((col, index) => (
                          <Draggable key={col.key} draggableId={String(col.key)} index={index}>
                            {(prov, snapshot) => (
                              <TableHead
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                className={cn(
                                  snapshot.isDragging ? "bg-[#f9fafb]" : "",
                                  col.key === "view" && "min-w-[240px] text-right pr-2",
                                )}
                              >
                                <TableColumnHeader
                                  label={col.label}
                                  columnKey={col.key}
                                  sortable={col.key !== "view"}
                                  draggable
                                  dragHandleProps={prov.dragHandleProps}
                                  getSortIcon={getSortIcon}
                                  onSort={handleSort}
                                  onSortAsc={handleSortAsc}
                                  onSortDesc={handleSortDesc}
                                  onFilter={openFilterForColumn}
                                  showFilter={availableFilterFields.some((f) => f.key === col.key)}
                                  filterDisabled={!availableFilterFields.some((f) => f.key === col.key)}
                                  pinned={col.pinned ?? null}
                                  onPinColumn={pinColumn}
                                  onUnpinColumn={unpinColumn}
                                  onHideColumn={hideColumn}
                                  onManageColumns={() => setShowColumnsPanel(true)}
                                />
                              </TableHead>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TableRow>
                    )}
                  </Droppable>
                </TableHeader>
              <TableBody>
                {data.length === 0 && !isLoading ? (
                  <TableRow>
                    <TableCell colSpan={getOrderedColumns().length} className="text-center py-4">
                      No workflow stage data found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <ContextMenu
                      key={item.id}
                      open={openContextMenuRowId === item.id}
                      onOpenChange={(o) => setOpenContextMenuRowId(o ? item.id : null)}
                    >
                      <ContextMenuTrigger asChild>
                        <TableRow
                          onMouseEnter={() => setHoveredRowId(item.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          className="cursor-default"
                        >
                          {getOrderedColumns().map((col) => (
                            <TableCell
                              key={col.key}
                              className={cn(col.key === "view" && "min-w-[240px] text-right pr-2")}
                            >
                              {renderCell(item, col.key)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-40">
                        <ContextMenuItem onSelect={() => handleView(item)}>View</ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))
                )}
              </TableBody>
            </Table>
          </DragDropContext>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e2e2]">
        <div className="flex items-center space-x-2 text-sm">
          <span>Items per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val))
              goToPage(1)
            }}
          >
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-[#505050]">
          {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" disabled={currentPage === 1} onClick={() => goToPage(1)}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" disabled={currentPage === 1} onClick={goToPreviousPage}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-[#505050] px-2">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" disabled={currentPage === totalPages || totalPages === 0} onClick={goToNextPage}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" disabled={currentPage === totalPages || totalPages === 0} onClick={() => goToPage(totalPages)}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ColumnsPanel
        open={showColumnsPanel}
        columns={columns}
        onClose={() => setShowColumnsPanel(false)}
        onChange={setColumns}
      />
      {showSavedFiltersPanel &&
        createPortal(
          <>
            <div
              className={cn(
                "fixed inset-0 bg-black transition-opacity duration-600 z-[9998]",
                showSavedFiltersPanel ? "bg-opacity-50" : "bg-opacity-0",
              )}
              onClick={() => setShowSavedFiltersPanel(false)}
            />
            <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300 z-[9999]">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#040404]">Saved Filters</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowSavedFiltersPanel(false)} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Enter filter name..."
                  value={filterNameInput}
                  onChange={(e) => setFilterNameInput(e.target.value)}
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {savedFilters.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500">No saved filters</div>
                ) : (
                  <div className="space-y-2">
                    {savedFilters.map((sf) => (
                      <div
                        key={sf.id}
                        className="flex items-center justify-between p-3 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer"
                        onMouseEnter={() => setHoveredFilterId(sf.id)}
                        onMouseLeave={() => setHoveredFilterId(null)}
                        onClick={() => handleApplySavedFilter(sf)}
                      >
                        <div>
                          <p className="font-medium">{sf.name}</p>
                          <p className="text-xs text-gray-500">{new Date(sf.createdAt).toLocaleDateString()}</p>
                        </div>
                        {hoveredFilterId === sf.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFilter(sf.id)
                            }}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                <Button
                  onClick={handleSaveFilter}
                  disabled={!filterNameInput.trim()}
                  className="w-full bg-[#5499a2] hover:bg-[#5499a2]/90 text-white disabled:bg-gray-300 disabled:text-gray-500"
                >
                  Save filter
                </Button>
              </div>
            </div>
          </>,
          document.body,
        )}

      {showAddFilterPanel &&
        !editingFilter &&
        createPortal(
          <>
            <div
              className={cn(
                "fixed inset-0 bg-black transition-opacity duration-600 z-[9998]",
                showAddFilterPanel ? "bg-opacity-50" : "bg-opacity-0",
              )}
              onClick={() => {
                setShowAddFilterPanel(false)
                setShowSpecificFilterPanel(false)
                setSelectedFilterField(null)
                setEditingFilter(null)
              }}
            />
            <div
              className={cn(
                "fixed top-0 h-full w-full md:w-96 bg-white shadow-xl flex flex-col transition-all duration-300 z-[9999]",
                showSpecificFilterPanel ? "md:right-[307.2px] right-0" : "right-0",
              )}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#040404]">Add Filter</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowAddFilterPanel(false)
                      setShowSpecificFilterPanel(false)
                      setSelectedFilterField(null)
                      setEditingFilter(null)
                    }}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">Select a field to filter by:</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {availableFilterFields.map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center justify-between p-3 rounded-md border border-gray-200 transition-colors hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectFilterField(field)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-[#040404]">{field.label}</p>
                        <p className="text-xs capitalize text-gray-500">{field.type} filter</p>
                      </div>
                      <div className="text-gray-400">
                        <ChevronRightIcon className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {showAddFilterPanel && !editingFilter && showSpecificFilterPanel && (
              <div
                className="fixed top-0 left-0 md:right-96 right-0 h-full bg-black bg-opacity-10 transition-opacity duration-600 z-[9999]"
                onClick={() => {
                  setShowSpecificFilterPanel(false)
                  setSelectedFilterField(null)
                }}
              />
            )}
          </>,
          document.body,
        )}

      {showSpecificFilterPanel &&
        selectedFilterField &&
        createPortal(
          <>
            <div
              className={cn(
                "fixed inset-0 bg-black transition-opacity duration-600 z-[10000]",
                showSpecificFilterPanel ? "bg-opacity-50" : "bg-opacity-0",
              )}
              onClick={() => {
                setShowSpecificFilterPanel(false)
                setShowAddFilterPanel(false)
                setSelectedFilterField(null)
                setEditingFilter(null)
              }}
            />
            <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300 z-[10001]">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {!editingFilter && (
                      <Button variant="ghost" size="icon" onClick={handleBackToFilterList} className="h-8 w-8">
                        <ChevronLeftIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <h3 className="text-lg font-semibold text-[#040404]">{selectedFilterField.label}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowAddFilterPanel(false)
                      setShowSpecificFilterPanel(false)
                      setSelectedFilterField(null)
                      setEditingFilter(null)
                    }}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  {editingFilter ? "Edit your filter:" : "Configure your filter:"}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">{renderSpecificFilterContent()}</div>
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                <Button onClick={handleApplySpecificFilter} className="w-full bg-[#5499a2] hover:bg-[#5499a2]/90 text-white">
                  {editingFilter ? "Update Filter" : "Apply Filter"}
                </Button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
