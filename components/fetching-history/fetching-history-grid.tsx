"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  X,
  Loader2,
  History,
  Eye,
  Info,
  FileTextIcon,
  MoreVertical,
  Edit,
  Pencil,
  FileText,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Plus, Bookmark, RefreshCw, Columns3 } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import type { FetchingHistoryData } from "@/app/actions/fetching-history"
import { getFetchingHistory, getProcessingCounts } from "@/app/actions/fetching-history"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { HorizontalScroller } from "@/components/horizontal-scroller"
import { commonStatusMap } from "@/lib/status-config"
import { Progress } from "@/components/ui/progress"
import TableColumnHeader from "@/components/table-column-header"
import { format, parseISO, subDays, startOfDay, endOfDay } from "date-fns"
import { createPortal } from "react-dom"
import { Badge } from "@/components/ui/badge"
import { useViewBlade } from "@/lib/view-blade-context"
import { useBladeStack } from "@/lib/blade-stack-context"
import { getFluxNames, updateReportById } from "@/app/actions/reports"
import { useEditBlade } from "@/lib/edit-blade-context"
import { useTestNotification, type NotificationAction } from "@/lib/test-notification-context"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import FluxDetailsInfoPanel from "../processing-history/FluxDetailsInfoPanel"
import { FetchingHistoryMenuItems, type FetchingHistoryMenuAction } from "./menu-items"
import ColumnsPanel from "@/components/shared/ColumnsPanel"

type SortDirection = "asc" | "desc" | null
type ColumnKey = keyof FetchingHistoryData | "view"

interface Column {
  key: ColumnKey
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

const statusOptions = ["Success", "Currently fetching", "Failed"]

const progressOptions = [
  { label: "0% - 25%", min: 0, max: 25 },
  { label: "26% - 50%", min: 26, max: 50 },
  { label: "51% - 75%", min: 51, max: 75 },
  { label: "76% - 100%", min: 76, max: 100 },
]

const durationOptions = [
  { label: "0-1 min", min: 0, max: 60 },
  { label: "1-2 min", min: 60, max: 120 },
  { label: "2-5 min", min: 120, max: 300 },
  { label: "5-10 min", min: 300, max: 600 },
  { label: "10-20 min", min: 600, max: 1200 },
  { label: "20+ min", min: 1200, max: null },
]

const timeRangeOptions = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "last7days" },
  { label: "Last 15 days", value: "last15days" },
  { label: "Last 30 days", value: "last30days" },
  { label: "Last 2 months", value: "last2months" },
  { label: "Custom date range", value: "custom" },
]

const errorTypeOptions = [
  "Unsupported Content Location",
  "No Attachment",
  "Attachment Found But Does Not Match Attachment Rule",
  "Email Fetch Error",
  "Error While Processing Email",
  "Error While Processing Attachment",
  "Http Fetch Error",
  "One Attachment For Multiple Flux",
  "Inconsistent Metadata",
  "Flux Does Not Match Mail",
  "Unable To Deserialize Json Content",
  "Error When Trying To Link With Raw Database",
  "Already Exist In Raw Database",
  "Configuration Error",
  "Empty Content",
  "Custom Implementation Error",
  "Unknown Flux Type",
  "Undefined",
]

export const FetchingHistoryGrid: React.FC<{
  fluxId: string
  fluxIdFilter?: number | null
  onClearFluxId?: () => void
  onProcessingsClick?: (fetchingID: number) => void
  onContentClick?: (fetchingID: number) => void
  onViewClick?: (fetchingID: number, fluxId?: number) => void
  statusFilter?: string | null
  durationBucketFilter?: string | null
  errorTypeFilter?: string | null
  dateFilter?: string | null
  onClearStatusFilter?: () => void
  onClearDurationBucketFilter?: () => void
  onClearErrorTypeFilter?: () => void
  onClearDateFilter?: () => void
}> = ({
  fluxId,
  fluxIdFilter,
  onClearFluxId,
  onProcessingsClick,
  onContentClick,
  onViewClick,
  statusFilter,
  durationBucketFilter,
  errorTypeFilter,
  dateFilter,
  onClearStatusFilter,
  onClearDurationBucketFilter,
  onClearErrorTypeFilter,
  onClearDateFilter,
}) => {
  const [data, setData] = useState<FetchingHistoryData[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [sortColumn, setSortColumn] = useState<ColumnKey | null>("timestamp")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([])
  const [showSavedFiltersPanel, setShowSavedFiltersPanel] = useState(false)
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [filterNameInput, setFilterNameInput] = useState("")
  const [hoveredFilterId, setHoveredFilterId] = useState<string | null>(null)
  const [showAddFilterPanel, setShowAddFilterPanel] = useState(false)
  const [selectedFilterField, setSelectedFilterField] = useState<FilterField | null>(null)
  const [showSpecificFilterPanel, setShowSpecificFilterPanel] = useState(false)
  const [editingFilter, setEditingFilter] = useState<AppliedFilter | null>(null)

  // Filter states
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedProgressRanges, setSelectedProgressRanges] = useState<string[]>([])
  const [selectedDurationRanges, setSelectedDurationRanges] = useState<string[]>([])
  const [selectedStartTimeRange, setSelectedStartTimeRange] = useState("")
  const [selectedEndTimeRange, setSelectedEndTimeRange] = useState("")
  const [startTimeAfter, setStartTimeAfter] = useState("")
  const [startTimeBefore, setStartTimeBefore] = useState("")
  const [endTimeAfter, setEndTimeAfter] = useState("")
  const [endTimeBefore, setEndTimeBefore] = useState("")
  const [selectedErrorTypes, setSelectedErrorTypes] = useState<string[]>([])
  const [textInputValue, setTextInputValue] = useState("")
  const [fluxNames, setFluxNames] = useState<Record<number, string>>({})
  const { openBlade: openViewBladeCtx } = useViewBlade()
  const { openBlade: openStackBlade } = useBladeStack()
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null)
  const [openDropdownRowId, setOpenDropdownRowId] = useState<number | null>(null)
  const [openContextMenuRowId, setOpenContextMenuRowId] = useState<number | null>(null)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [quickFluxId, setQuickFluxId] = useState<number | null>(null)
  const [showColumnsPanel, setShowColumnsPanel] = useState(false)

  const { openBlade: openEditBladeCtx } = useEditBlade()
  const { showCustomNotification, hideCustomNotification } = useTestNotification()
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const [selectedFluxForRename, setSelectedFluxForRename] = useState<{ id: number; name: string } | null>(null)

  const openViewBlade = useCallback(
    (id: number | string, name?: string) => {
      const rid = String(id)
      openViewBladeCtx(rid, name, { stackControlled: true })
      openStackBlade(
        () => import("@/components/view-flux-blade/ViewFluxBlade"),
        {
          reportId: rid,
        },
        name,
      )
    },
    [openViewBladeCtx, openStackBlade],
  )

  const openEditBlade = useCallback(
    (id: number | string, name?: string) => {
      const rid = String(id)
      openEditBladeCtx(rid, name, { stackControlled: true })
      openStackBlade(
        () => import("@/components/edit-flux-blade/EditFluxBlade"),
        {
          reportId: rid,
        },
        name,
      )
    },
    [openEditBladeCtx, openStackBlade],
  )

  const handleEditFlux = (id: number) => {
    const name = fluxNames[id] || `Flux ${id}`
    openEditBlade(id, name)
  }

  const handleRenameClick = (id: number) => {
    const name = fluxNames[id] || `Flux ${id}`
    setOpenContextMenuRowId(null)
    setSelectedFluxForRename({ id, name })
    setRenameValue(name)
    setIsRenameDialogOpen(true)
  }

  const handleRenameConfirm = async () => {
    if (!selectedFluxForRename) return
    const { id } = selectedFluxForRename
    const oldName = selectedFluxForRename.name
    const newName = renameValue.trim()
    if (!newName || newName === oldName) {
      setIsRenameDialogOpen(false)
      return
    }
    await updateReportById(id, { name: newName })
    setFluxNames((prev) => ({ ...prev, [id]: newName }))
    setIsRenameDialogOpen(false)
    setSelectedFluxForRename(null)

    const undoAction: NotificationAction = {
      label: "Undo",
      variant: "destructive",
      onClick: async () => {
        await updateReportById(id, { name: oldName })
        setFluxNames((prev) => ({ ...prev, [id]: oldName }))
        hideCustomNotification()
      },
    }
    const closeAction: NotificationAction = {
      label: "Close",
      variant: "ghost",
      onClick: () => hideCustomNotification(),
    }
    showCustomNotification(`"${oldName}" renamed to "${newName}"`, [undoAction, closeAction])
  }

  const handleMenuAction = (action: FetchingHistoryMenuAction, row: FetchingHistoryData) => {
    const fluxName = fluxNames[row.fluxID] || `Flux ${row.fluxID}`
    switch (action) {
      case "viewDetails":
        onViewClick?.(row.fetchingID, row.fluxID)
        break
      case "quickFlux":
        setQuickFluxId(row.fluxID)
        break
      case "viewFlux":
        openViewBlade(String(row.fluxID), fluxName)
        break
      case "editFlux":
        handleEditFlux(row.fluxID)
        break
      case "renameFlux":
        handleRenameClick(row.fluxID)
        break
      case "viewContent":
        onContentClick?.(row.fetchingID)
        break
      case "viewProcessings":
        onProcessingsClick?.(row.fetchingID)
        break
      default:
        break
    }
  }

  const showFluxId = fluxId === "all"
  const [columns, setColumns] = useState<Column[]>([
    { key: "fetchingID", label: "ID", hidden: false },
    ...(showFluxId ? [{ key: "fluxID", label: "Flux ID", hidden: false }] : []),
    { key: "status", label: "Status", hidden: false },
    { key: "timestamp", label: "Fetch Start", hidden: false },
    { key: "completedAt", label: "Fetch End", hidden: false },
    { key: "fetchingTimeInSeconds", label: "Duration (min)", hidden: false },
    { key: "progress", label: "Progress", hidden: false },
    { key: "processingsCount", label: "Processings", hidden: false },
    { key: "numberOfContent", label: "Content", hidden: false },
    { key: "errorMessage", label: "Error Message", hidden: false },
    { key: "view", label: "", hidden: false },
  ])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("fetching-history-columns")
    if (stored) {
      try {
        setColumns(JSON.parse(stored))
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fetching-history-columns", JSON.stringify(columns))
    }
  }, [columns])

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

  const availableFilterFields: FilterField[] = [
    ...(showFluxId ? [{ key: "fluxID", label: "Flux ID", type: "text" }] : []),
    { key: "status", label: "Status", type: "status" },
    { key: "progress", label: "Progress", type: "progress" },
    { key: "fetchingTimeInSeconds", label: "Duration of fetching", type: "duration" },
    { key: "timestamp", label: "Fetch started time", type: "timerange" },
    { key: "completedAt", label: "Fetch end time", type: "timerange" },
    { key: "errorMessage", label: "Type of error", type: "errortype" },
  ]

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

  const getDateRangeForTimeOption = (option: string) => {
    const now = new Date()
    switch (option) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) }
      case "last7days":
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) }
      case "last15days":
        return { start: startOfDay(subDays(now, 15)), end: endOfDay(now) }
      case "last30days":
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) }
      case "last2months":
        return { start: startOfDay(subDays(now, 60)), end: endOfDay(now) }
      default:
        return null
    }
  }

  // Handle all summary filters (status, duration, error, date) together
  useEffect(() => {
    const newFilters: AppliedFilter[] = []
    
    // Add status filter if present
    if (statusFilter) {
      newFilters.push({
        id: "status_summary",
        field: "status",
        operator: "in",
        value: [statusFilter],
        label: `Status: ${statusFilter}`,
      })
    }
    
    // Add duration filter if present
    if (durationBucketFilter) {
      newFilters.push({
        id: "duration_summary",
        field: "fetchingTimeInSeconds",
        operator: "duration_ranges",
        value: [durationBucketFilter],
        label: `Duration: ${durationBucketFilter}`,
      })
    }
    
    // Add error filter if present
    if (errorTypeFilter) {
      newFilters.push({
        id: "error_summary",
        field: "errorMessage",
        operator: "error_contains",
        value: [errorTypeFilter],
        label: `Error: ${errorTypeFilter}`,
      })
    }
    
    // Add date filter if present
    if (dateFilter) {
      newFilters.push({
        id: "date_summary",
        field: "timestamp",
        operator: "date_range",
        value: {
          start: `${dateFilter}T00:00:00.000Z`,
          end: `${dateFilter}T23:59:59.999Z`,
        },
        label: `Date: ${dateFilter}`,
      })
    }
    
    // Keep existing filters that are not summary filters, then add new summary filters
    setAppliedFilters((prev) => [
      ...prev.filter((f) => !["status_summary", "duration_summary", "error_summary", "date_summary"].includes(f.id)),
      ...newFilters
    ])
    
    // Reset to first page when filters change
    if (newFilters.length > 0) {
      setCurrentPage(1)
    }
  }, [statusFilter, durationBucketFilter, errorTypeFilter, dateFilter])

  useEffect(() => {
    if (fluxIdFilter !== null && fluxIdFilter !== undefined) {
      const otherFilters = appliedFilters.filter((f) => f.id !== "flux")
      const fluxFilter: AppliedFilter = {
        id: "flux",
        field: "fluxID",
        operator: "equals",
        value: fluxIdFilter,
        label: `Flux ID: ${fluxIdFilter}`,
      }
      setAppliedFilters([...otherFilters, fluxFilter])
      setCurrentPage(1)
    } else {
      setAppliedFilters((prev) => prev.filter((f) => f.id !== "flux"))
    }
  }, [fluxIdFilter])

  const fetchData = useCallback(async () => {
    setIsLoading(true)

    let serverFilters = appliedFilters.map((filter) => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
    }))

    if (fluxIdFilter !== null && fluxIdFilter !== undefined) {
      serverFilters = serverFilters.filter((f) => f.field !== "fluxID")
      serverFilters.push({ field: "fluxID", operator: "equals", value: fluxIdFilter })
    }

    try {
      const res = await fetch("/api/fetching-history/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fluxId,
          page: currentPage,
          pageSize,
          sortColumn,
          sortDirection,
          filters: serverFilters,
          showFluxId,
        }),
      })

      const {
        data,
        totalCount: newTotalCount,
        error,
        fluxNames: names,
      } = await res.json()

      if (error) {
        console.error("Failed to fetch history:", error)
        setData([])
        setTotalCount(0)
      } else {
        setData(data)
        if (showFluxId) {
          setFluxNames(names || {})
        } else {
          setFluxNames({})
        }
        setTotalCount(newTotalCount)
        setTotalPages(Math.ceil(newTotalCount / pageSize) || 1)
      }
    } catch (err) {
      console.error("Failed to fetch history:", err)
      setData([])
      setTotalCount(0)
    }
    setIsLoading(false)
  }, [fluxId, fluxIdFilter, currentPage, pageSize, sortColumn, sortDirection, appliedFilters, showFluxId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (showAddFilterPanel || showSpecificFilterPanel) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [showAddFilterPanel, showSpecificFilterPanel])

  const handleSort = (columnKey: ColumnKey) => {
    if (columnKey === "view") return
    const newDirection = sortColumn === columnKey && sortDirection === "asc" ? "desc" : "asc"
    setSortColumn(columnKey)
    setSortDirection(newDirection)
    setCurrentPage(1)
  }

  const handleSortAsc = (columnKey: ColumnKey) => {
    if (columnKey === "view") return
    setSortColumn(columnKey)
    setSortDirection("asc")
    setCurrentPage(1)
  }

  const handleSortDesc = (columnKey: ColumnKey) => {
    if (columnKey === "view") return
    setSortColumn(columnKey)
    setSortDirection("desc")
    setCurrentPage(1)
  }

  const hideColumn = (key: ColumnKey) => {
    setColumns((cols) => cols.map((c) => (c.key === key ? { ...c, hidden: true } : c)))
  }

  const openFilterForColumn = (key: ColumnKey) => {
    const field = availableFilterFields.find((f) => f.key === key)
    if (!field) return
    handleSelectFilterField(field)
    setShowAddFilterPanel(false)
  }

  const pinColumn = (key: ColumnKey, side: "left" | "right") => {
    setColumns((cols) => cols.map((c) => (c.key === key ? { ...c, pinned: side } : c)))
  }

  const unpinColumn = (key: ColumnKey) => {
    setColumns((cols) => cols.map((c) => (c.key === key ? { ...c, pinned: undefined } : c)))
  }

  const getSortIcon = (columnKey: ColumnKey) => {
    if (sortColumn === columnKey) {
      return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
    }
    return <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
  }

  const renderCell = (item: FetchingHistoryData, columnKey: ColumnKey) => {
    const value = item[columnKey]
    const fluxName = fluxNames[item.fluxID] || `Flux ${item.fluxID}`

    switch (columnKey) {
      case "fetchingID":
        return (
          <Badge
            className="bg-black text-white hover:bg-gray-300 cursor-pointer rounded-full px-2"
            onClick={() => onViewClick?.(item.fetchingID, item.fluxID)}
          >
            {item.fetchingID}
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
        return <span className="text-sm">{item.status}</span>
      case "timestamp":
      case "completedAt":
        if (!value) return "–"
        try {
          return format(parseISO(value as string), "dd MMM yyyy HH:mm")
        } catch {
          return "Invalid Date"
        }
      case "fetchingTimeInSeconds":
        if (value === null || value === undefined) return "–"
        return `${Math.round((value as number) / 60)} min`
      case "progress":
        if (value === null || value === undefined) return "–"
        return (
          <div className="flex items-center gap-2">
            <Progress
              value={value as number}
              className="w-[60%]"
              indicatorColor="black"
            />
            <span className="text-sm text-gray-600">{value}%</span>
          </div>
        )
      case "fluxID": {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className="bg-black text-white hover:bg-gray-300 cursor-pointer rounded-full px-2"
                  onClick={() => openViewBlade(String(item.fluxID), fluxName)}
                >
                  {item.fluxID}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{fluxName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
      case "processingsCount":
        const count = item.processingsCount?.[0]?.count ?? 0
        return (
          <Badge
            className="bg-black text-white hover:bg-gray-300 cursor-pointer rounded-full px-2"
            onClick={() => onProcessingsClick?.(item.fetchingID)}
          >
            {count}
          </Badge>
        )
      case "numberOfContent":
        const contentCount = item.numberOfContent ?? 0
        return (
          <Badge
            className="bg-black text-white hover:bg-gray-300 cursor-pointer rounded-full px-2"
            onClick={() => onContentClick?.(item.fetchingID)}
          >
            {contentCount}
          </Badge>
        )
      case "errorMessage":
        return value ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate max-w-[150px] inline-block">{String(value)}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{String(value)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          "No message"
        )
      case "view": {
        return (
          <div className="flex items-center justify-end space-x-1 pr-2">
            {isLargeScreen &&
              (hoveredRowId === item.fetchingID || openDropdownRowId === item.fetchingID) && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                          onClick={() => onViewClick?.(item.fetchingID, item.fluxID)}
                        >
                          <FileTextIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View details</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                          onClick={() => setQuickFluxId(item.fluxID)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Quick Flux details</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                          onClick={() => openViewBlade(String(item.fluxID), fluxName)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View Flux</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            <DropdownMenu onOpenChange={(o) => setOpenDropdownRowId(o ? item.fetchingID : null)}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <FetchingHistoryMenuItems
                  item={item}
                  onAction={(action) => handleMenuAction(action, item)}
                  components={{ Item: DropdownMenuItem, Separator: DropdownMenuSeparator }}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }
      default:
        return String(value ?? "–")
    }
  }

  const handleApplySpecificFilter = () => {
    if (!selectedFilterField) return

    let filterValue: any
    let operator: string
    let label: string

    switch (selectedFilterField.type) {
      case "status":
        if (selectedStatuses.length === 0) return
        filterValue = selectedStatuses
        operator = "in"
        label = `Status: ${selectedStatuses.join(", ")}`
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
        const isStartTime = selectedFilterField.key === "timestamp"
        const selectedRange = isStartTime ? selectedStartTimeRange : selectedEndTimeRange
        const afterDate = isStartTime ? startTimeAfter : endTimeAfter
        const beforeDate = isStartTime ? startTimeBefore : endTimeBefore

        if (!selectedRange) return

        if (selectedRange === "custom") {
          if (!afterDate && !beforeDate) return
          filterValue = { after: afterDate, before: beforeDate }
          operator = "custom_date_range"
          label = `${selectedFilterField.label}: Custom (${afterDate || "any"} - ${beforeDate || "any"})`
        } else {
          const dateRange = getDateRangeForTimeOption(selectedRange)
          if (!dateRange) return
          filterValue = dateRange
          operator = "date_range"
          const rangeLabel = timeRangeOptions.find((opt) => opt.value === selectedRange)?.label || selectedRange
          label = `${selectedFilterField.label}: ${rangeLabel}`
        }
        break
      case "errortype":
        if (selectedErrorTypes.length === 0) return
        filterValue = selectedErrorTypes
        operator = "error_contains"
        label = `Error Type: ${selectedErrorTypes.length} selected`
        break
      case "text":
        if (!textInputValue.trim()) return
        filterValue = textInputValue.trim()
        operator = "equals"
        label = `${selectedFilterField.label}: ${textInputValue.trim()}`
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

    setCurrentPage(1)
    setShowSpecificFilterPanel(false)
    setShowAddFilterPanel(false)
    setSelectedFilterField(null)
    setEditingFilter(null)

    setSelectedStatuses([])
    setSelectedProgressRanges([])
    setSelectedDurationRanges([])
    setSelectedStartTimeRange("")
    setSelectedEndTimeRange("")
    setStartTimeAfter("")
    setStartTimeBefore("")
    setEndTimeAfter("")
    setEndTimeBefore("")
    setSelectedErrorTypes([])
  }

  const handleBackToFilterList = () => {
    setShowSpecificFilterPanel(false)
    setSelectedFilterField(null)
  }

  function handleSelectFilterField(field: FilterField) {
    setSelectedFilterField(field)
    setShowSpecificFilterPanel(true)

    setSelectedStatuses([])
    setSelectedProgressRanges([])
    setSelectedDurationRanges([])
    setSelectedStartTimeRange("")
    setSelectedEndTimeRange("")
    setStartTimeAfter("")
    setStartTimeBefore("")
    setEndTimeAfter("")
    setEndTimeBefore("")
    setSelectedErrorTypes([])
    setTextInputValue("")
  }

  function handleEditFilter(filter: AppliedFilter) {
    const field = availableFilterFields.find((f) => f.key === filter.field)
    if (!field) return

    setSelectedFilterField(field)
    setEditingFilter(filter)

    switch (field.type) {
      case "status":
        setSelectedStatuses(Array.isArray(filter.value) ? filter.value : [String(filter.value)])
        break
      case "progress":
        setSelectedProgressRanges(Array.isArray(filter.value) ? filter.value : [String(filter.value)])
        break
      case "duration":
        setSelectedDurationRanges(Array.isArray(filter.value) ? filter.value : [String(filter.value)])
        break
      case "timerange":
        const isStartTime = field.key === "timestamp"
        if (filter.operator === "custom_date_range") {
          if (isStartTime) {
            setSelectedStartTimeRange("custom")
            setStartTimeAfter(filter.value.after || "")
            setStartTimeBefore(filter.value.before || "")
          } else {
            setSelectedEndTimeRange("custom")
            setEndTimeAfter(filter.value.after || "")
            setEndTimeBefore(filter.value.before || "")
          }
        } else {
          const matchingOption = timeRangeOptions.find((opt) => {
            if (opt.value === "custom") return false
            const dateRange = getDateRangeForTimeOption(opt.value)
            return dateRange && JSON.stringify(dateRange) === JSON.stringify(filter.value)
          })
          if (isStartTime) {
            setSelectedStartTimeRange(matchingOption?.value || "")
          } else {
            setSelectedEndTimeRange(matchingOption?.value || "")
          }
        }
        break
      case "errortype":
        setSelectedErrorTypes(Array.isArray(filter.value) ? filter.value : [String(filter.value)])
        break
      case "text":
        setTextInputValue(String(filter.value || ""))
        break
    }

    setShowSpecificFilterPanel(true)
    setShowAddFilterPanel(false)
  }

  const handleRemoveFilter = (filterId: string) => {
    if (filterId === "status_summary") {
      onClearStatusFilter?.()
    } else if (filterId === "duration_summary") {
      onClearDurationBucketFilter?.()
    } else if (filterId === "error_summary") {
      onClearErrorTypeFilter?.()
    } else if (filterId === "date_summary") {
      onClearDateFilter?.()
    } else if (filterId === "flux") {
      onClearFluxId?.()
    }
    setAppliedFilters((prev) => prev.filter((f) => f.id !== filterId))
  }

  const renderSpecificFilterContent = () => {
    if (!selectedFilterField) return null

    switch (selectedFilterField.type) {
      case "status":
        return (
          <div className="space-y-2">
            {statusOptions.map((status) => (
              <div key={status} className="flex items-center gap-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={() =>
                    setSelectedStatuses((prev) =>
                      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
                    )
                  }
                />
                <label htmlFor={`status-${status}`}>{status}</label>
              </div>
            ))}
          </div>
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
                      prev.includes(range.label) ? prev.filter((r) => r !== range.label) : [...prev, range.label],
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
                      prev.includes(range.label) ? prev.filter((r) => r !== range.label) : [...prev, range.label],
                    )
                  }
                />
                <label htmlFor={`duration-${range.label}`}>{range.label}</label>
              </div>
            ))}
          </div>
        )

      case "timerange":
        const isStartTime = selectedFilterField.key === "timestamp"
        const selectedRange = isStartTime ? selectedStartTimeRange : selectedEndTimeRange
        const setSelectedRange = isStartTime ? setSelectedStartTimeRange : setSelectedEndTimeRange
        const afterDate = isStartTime ? startTimeAfter : endTimeAfter
        const beforeDate = isStartTime ? startTimeBefore : endTimeBefore
        const setAfterDate = isStartTime ? setStartTimeAfter : setEndTimeAfter
        const setBeforeDate = isStartTime ? setStartTimeBefore : setEndTimeBefore

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {timeRangeOptions.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`time-${option.value}`}
                    checked={selectedRange === option.value}
                    onCheckedChange={() => setSelectedRange(selectedRange === option.value ? "" : option.value)}
                  />
                  <label htmlFor={`time-${option.value}`}>{option.label}</label>
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

      case "errortype":
        return (
          <div className="space-y-2">
            {errorTypeOptions.map((errorType) => (
              <div key={errorType} className="flex items-center gap-2">
                <Checkbox
                  id={`error-${errorType}`}
                  checked={selectedErrorTypes.includes(errorType)}
                  onCheckedChange={() =>
                    setSelectedErrorTypes((prev) =>
                      prev.includes(errorType) ? prev.filter((e) => e !== errorType) : [...prev, errorType],
                    )
                  }
                />
                <label htmlFor={`error-${errorType}`} className="text-sm">
                  {errorType}
                </label>
              </div>
            ))}
            </div>
          )
      case "text":
        return (
          <Input
            type="text"
            placeholder={`Enter ${selectedFilterField.label}`}
            value={textInputValue}
            onChange={(e) => setTextInputValue(e.target.value)}
          />
        )
      default:
          return null
      }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5499a2]" />
      </div>
    )
  }

  if (!isLoading && data.length === 0 && appliedFilters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center text-gray-500">
        <History className="h-16 w-16 mb-4 text-gray-300" />
        <p className="text-lg">No fetching history found for this flux.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="space-y-4 transition-all">
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
                onClick={() => {
                  if (appliedFilters.some((f) => f.id === "status_summary")) {
                    onClearStatusFilter?.()
                  }
                  setAppliedFilters([])
                }}
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
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-[#f0f9fa] hover:text-[#3d7a82] transition-all duration-200"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
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
                  <Droppable droppableId="columns-fetching-history" direction="horizontal">
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
                                  sortable
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
                {data.length > 0 ? (
                  data.map((item) => (
                    <ContextMenu
                      key={item.fetchingID}
                      open={openContextMenuRowId === item.fetchingID}
                      onOpenChange={(o) =>
                        setOpenContextMenuRowId(o ? item.fetchingID : null)
                      }
                    >
                      <ContextMenuTrigger asChild>
                        <TableRow
                          onMouseEnter={() => setHoveredRowId(item.fetchingID)}
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
                      <ContextMenuContent className="w-64">
                        <FetchingHistoryMenuItems
                          item={item}
                          onAction={(action) => handleMenuAction(action, item)}
                          components={{ Item: ContextMenuItem, Separator: ContextMenuSeparator }}
                        />
                      </ContextMenuContent>
                    </ContextMenu>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={getOrderedColumns().length} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DragDropContext>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="flex items-center space-x-2 text-sm">
              <span>Items per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val))
                  setCurrentPage(1)
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
          </div>
        </CardContent>
      </Card>

      {showAddFilterPanel &&
        !editingFilter &&
        createPortal(
          <>
            <div
              className={cn(
                "fixed inset-0 bg-black transition-opacity duration-600 z-[60000]",
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
                "fixed top-0 h-full w-96 bg-white shadow-xl flex flex-col transition-all duration-300 z-[60001]",
                showSpecificFilterPanel ? "right-[307.2px]" : "right-0",
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
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md border border-gray-200 transition-colors",
                        showSpecificFilterPanel ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50 cursor-pointer",
                      )}
                      onClick={() => !showSpecificFilterPanel && handleSelectFilterField(field)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-[#040404]">{field.label}</p>
                        <p className="text-xs capitalize text-gray-500">{field.type} filter</p>
                      </div>
                      <div className="text-gray-400">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {showAddFilterPanel && !editingFilter && showSpecificFilterPanel && (
              <div
                className="fixed top-0 left-0 right-96 h-full bg-black bg-opacity-10 transition-opacity duration-600 z-[60001]"
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
                "fixed inset-0 bg-black transition-opacity duration-600 z-[60000]",
                showSpecificFilterPanel ? "bg-opacity-50" : "bg-opacity-0",
              )}
              onClick={() => {
                setShowSpecificFilterPanel(false)
                setShowAddFilterPanel(false)
                setSelectedFilterField(null)
                setEditingFilter(null)
              }}
            />
            <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300 z-[60002]">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {!editingFilter && (
                      <Button variant="ghost" size="icon" onClick={handleBackToFilterList} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
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
                <Button
                  onClick={handleApplySpecificFilter}
                  className="w-full bg-[#5499a2] hover:bg-[#5499a2]/90 text-white"
                >
                  {editingFilter ? "Update Filter" : "Apply Filter"}
                </Button>
              </div>
            </div>
          </>,
          document.body,
        )}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md z-[10050] [&~div]:z-[10040]" style={{ zIndex: 10050 }}>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {quickFluxId !== null &&
        createPortal(
          <FluxDetailsInfoPanel
            reportId={String(quickFluxId)}
            open={quickFluxId !== null}
            onClose={() => setQuickFluxId(null)}
            drawer
          />,
          document.body,
        )}
      <ColumnsPanel
        open={showColumnsPanel}
        columns={columns}
        onClose={() => setShowColumnsPanel(false)}
        onChange={setColumns}
      />
    </div>
  </div>
  )
}
