"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { format, parse } from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Loader2,
  Database,
  Globe,
  Mail,
  FileText,
  HardDrive,
  Webhook,
  Plus,
  Bookmark,
  X,
  RefreshCw,
  Check,
  ChevronsRight,
  Eye,
  Edit,
  Pencil,
  Copy,
  Zap,
  History,
  Clock,
  Bug,
  DollarSign,
  FileTextIcon,
  Trash2,
  MoreVertical,
  Download,
  Columns3,
  Filter as FilterIcon,
  Pin,
  PinOff,
  EyeOff,
} from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { cn } from "@/lib/utils"
import { useSearch } from "@/lib/search-context"
import type { FluxData } from "@/lib/data-store"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { HorizontalScroller } from "@/components/horizontal-scroller"
import { commonStatusMap } from "@/lib/status-config"
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
// Use API routes instead of calling server actions directly
import { useEditBlade } from "@/lib/edit-blade-context" // Import useEditBlade
import { useViewBlade } from "@/lib/view-blade-context"
import { useBladeStack } from "@/lib/blade-stack-context"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ColumnsPanel from "@/components/shared/ColumnsPanel"
import { useTestNotification, type NotificationAction } from "@/lib/test-notification-context"
import TableColumnHeader from "@/components/table-column-header"

type SortDirection = "asc" | "desc" | null
type ColumnKey =
  | "id"
  | "name"
  | "financialType"
  | "fluxState"
  | "lastFetchingDate"
  | "fetchingStatus"
  | "numberOfErrorFetching"
  | "lastProcessingDate"
  | "actions"
  | "fluxType"

interface Column {
  key: ColumnKey
  label: string
  sortable: boolean
  draggable: boolean
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

const fluxTypeIcons = {
  API: Database,
  https: Globe,
  SFTP: HardDrive,
  Mail: Mail,
  File: FileText,
  Webhook: Webhook,
}

function formatDisplayDate(value: string) {
  if (!value) return ""
  const normalized = value.replace(" at ", " ")
  const date = new Date(normalized)
  if (isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

const stageOptions = [
  "Processing in progress",
  "Fetching in progress",
  "Validating in progress",
  "Analyzing in progress",
  "Pending in progress",
  "Completed",
  "Success",
  "Finished",
  "Done",
  "Failed",
  "Error",
  "Timeout",
  "Cancelled",
  "Rejected",
  "Paused",
  "Partially",
]

const financialTypeOptions = [
  "Fund",
  "Stock",
  "Bond",
  "ETF",
  "Cryptocurrency",
  "Derivative",
  "Commodity",
  "Forex",
  "Bench",
  "RealEstate",
  "Future",
  "PrivateEquity",
  "Spacs",
  "StructuredProduct",
  "Undefined",
]
const fluxTypeOptions = ["API", "https", "SFTP", "Mail", "File", "Webhook"]

const ReportsGrid: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const initialPage = Number(searchParams.get("page")) || 1
  const initialPageSize = Number(searchParams.get("pageSize")) || 10
  const { searchTerm, setSearchTerm } = useSearch()
  const { openBlade } = useEditBlade() // Use the new context
  const { openBlade: openViewBladeCtx } = useViewBlade()
  const { openBlade: openStackBlade } = useBladeStack()

  const [sortColumn, setSortColumn] = useState<ColumnKey | null>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(initialPage > 0 ? initialPage : 1)
  const [pageSize, setPageSize] = useState(initialPageSize > 0 ? initialPageSize : 10)

  const openViewBlade = useCallback(
    (id: string, name?: string) => {
      openViewBladeCtx(id, name, { stackControlled: true })
      openStackBlade(
        () => import("@/components/view-flux-blade/ViewFluxBlade"),
        {
          reportId: id,
        },
        name,
      )
    },
    [openViewBladeCtx, openStackBlade],
  )
  const [showLoadingTooltip, setShowLoadingTooltip] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([])
  const [showSavedFiltersPanel, setShowSavedFiltersPanel] = useState(false)
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [filterNameInput, setFilterNameInput] = useState("")
  const [hoveredFilterId, setHoveredFilterId] = useState<string | null>(null)
  const [showAddFilterPanel, setShowAddFilterPanel] = useState(false)
  const [selectedFilterField, setSelectedFilterField] = useState<FilterField | null>(null)
  const [showSpecificFilterPanel, setShowSpecificFilterPanel] = useState(false)
  const [textFilterValue, setTextFilterValue] = useState("")
  const [textFilterOperator, setTextFilterOperator] = useState("contains")
  const [numberFilterValue, setNumberFilterValue] = useState("")
  const [numberFilterOperator, setNumberFilterOperator] = useState("equals")
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [dateFilterValue, setDateFilterValue] = useState("")
  const [dateFilterOperator, setDateFilterOperator] = useState("equals")
  const [editingFilter, setEditingFilter] = useState<AppliedFilter | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [openDropdownRowId, setOpenDropdownRowId] = useState<string | null>(null)

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const [selectedItemForRename, setSelectedItemForRename] = useState<FluxData | null>(null)

  const [showColumnsPanel, setShowColumnsPanel] = useState(false)

  const savedFiltersInputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const numberInputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const [columns, setColumns] = useState<Column[]>([
    { key: "id", label: "ID", sortable: true, draggable: false, hidden: false },
    { key: "name", label: "Name", sortable: true, draggable: true, hidden: false },
    { key: "financialType", label: "Financial type", sortable: true, draggable: true, hidden: false },
    { key: "fluxState", label: "Status", sortable: true, draggable: true, hidden: false },
    { key: "lastFetchingDate", label: "Last Fetching", sortable: true, draggable: true, hidden: false },
    { key: "fetchingStatus", label: "Fetching status", sortable: true, draggable: true, hidden: false },
    { key: "numberOfErrorFetching", label: "Fetch Errors", sortable: true, draggable: true, hidden: false },
    { key: "lastProcessingDate", label: "Last processing", sortable: true, draggable: true, hidden: false },
    { key: "actions", label: "", sortable: false, draggable: false, hidden: false },
  ])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("reports-columns")
    if (stored) {
      try {
        const parsed: Column[] = JSON.parse(stored)
        setColumns(parsed)
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("reports-columns", JSON.stringify(columns))
    }
  }, [columns])

  const availableFilterFields: FilterField[] = [
    { key: "id", label: "ID", type: "number" },
    { key: "name", label: "Name", type: "text" },
    { key: "fluxState", label: "Status", type: "select" },
    { key: "financialType", label: "Financial Type", type: "select" },
    { key: "fluxType", label: "Flux Type", type: "select" },
    { key: "lastFetchingDate", label: "Last Fetching Date", type: "date" },
    { key: "numberOfErrorFetching", label: "Fetching Error Count", type: "number" },
    { key: "lastProcessingDate", label: "Last Processing Date", type: "date" },
  ]

  const [isMobileView, setIsMobileView] = useState(false)
  const pageSizeOptions = [10, 20, 50]

  const [reportsData, setReportsData] = useState<FluxData[]>([])
  const [totalReportsCount, setTotalReportsCount] = useState(0)

  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window !== "undefined") {
        setIsMobileView(window.innerWidth < 768)
        setIsLargeScreen(window.innerWidth >= 1600)
      }
    }
    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  const isFilterFieldApplied = useCallback(
    (fieldKey: string) => appliedFilters.some((filter) => filter.field === fieldKey),
    [appliedFilters],
  )

  const updateUrlWithPagination = useCallback(
    (page: number, size: number, col: ColumnKey | null, dir: SortDirection) => {
      const params = new URLSearchParams(searchParams.toString())
      if (page > 1) params.set("page", page.toString())
      else params.delete("page")
      if (size !== 10) params.set("pageSize", size.toString())
      else params.delete("pageSize")
      if (col) params.set("sortColumn", col)
      else params.delete("sortColumn")
      if (dir) params.set("sortDirection", dir)
      else params.delete("sortDirection")
      if (searchTerm) params.set("q", searchTerm)
      else params.delete("q")

      const queryString = params.toString()
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname
      router.replace(newUrl, { scroll: false })
    },
    [router, searchParams, searchTerm, pathname],
  )

  const fetchData = useCallback(async () => {
    setIsDataLoaded(false)
    setShowLoadingTooltip(true)
    const params = new URLSearchParams()
    params.set("page", String(currentPage))
    params.set("pageSize", String(pageSize))
    if (sortColumn) params.set("sortColumn", sortColumn)
    if (sortDirection) params.set("sortDirection", sortDirection)
    if (searchTerm) params.set("q", searchTerm)
    if (appliedFilters.length > 0) {
      params.set("filters", JSON.stringify(appliedFilters))
    }

    const res = await fetch(`/api/reports?${params.toString()}`, {
      cache: "no-store",
    })
    const { data, totalCount, error } = await res.json()

    if (error) {
      console.error("Failed to fetch reports:", error)
      setReportsData([])
      setTotalReportsCount(0)
    } else {
      setReportsData(data)
      setTotalReportsCount(totalCount)
      setTotalPages(Math.ceil(totalCount / pageSize) || 1)
    }
    setIsDataLoaded(true)
    setShowLoadingTooltip(false)
  }, [currentPage, pageSize, sortColumn, sortDirection, searchTerm, appliedFilters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const urlPage = searchParams.get("page")
    const pageNum = urlPage ? Number.parseInt(urlPage, 10) : 1
    if (pageNum !== currentPage) setCurrentPage(pageNum > 0 ? pageNum : 1)

    const urlPageSize = searchParams.get("pageSize")
    const sizeNum = urlPageSize ? Number.parseInt(urlPageSize, 10) : 10
    if (sizeNum !== pageSize) setPageSize(sizeNum > 0 ? sizeNum : 10)
  }, [searchParams, currentPage, pageSize])

  useEffect(() => {
    if (currentPage > totalPages && totalReportsCount > 0) {
      setCurrentPage(1)
      updateUrlWithPagination(1, pageSize, sortColumn, sortDirection)
    } else if (totalReportsCount === 0 && currentPage !== 1) {
      setCurrentPage(1)
      updateUrlWithPagination(1, pageSize, sortColumn, sortDirection)
    }
  }, [totalReportsCount, pageSize, currentPage, totalPages, updateUrlWithPagination, sortColumn, sortDirection])

  const handleSort = useCallback(
    (columnKey: ColumnKey) => {
      let newSortDirection: SortDirection = "asc"
      let newSortColumn: ColumnKey | null = columnKey
      if (sortColumn === columnKey) {
        if (sortDirection === "asc") newSortDirection = "desc"
        else if (sortDirection === "desc") {
          newSortDirection = null
          newSortColumn = null
        }
      }
      setSortColumn(newSortColumn)
      setSortDirection(newSortDirection)
      setCurrentPage(1)
      updateUrlWithPagination(1, pageSize, newSortColumn, newSortDirection)
    },
    [sortColumn, sortDirection, pageSize, updateUrlWithPagination],
  )

  const handleSortAsc = (columnKey: ColumnKey) => {
    setSortColumn(columnKey)
    setSortDirection("asc")
    setCurrentPage(1)
    updateUrlWithPagination(1, pageSize, columnKey, "asc")
  }

  const handleSortDesc = (columnKey: ColumnKey) => {
    setSortColumn(columnKey)
    setSortDirection("desc")
    setCurrentPage(1)
    updateUrlWithPagination(1, pageSize, columnKey, "desc")
  }

  const hideColumn = (key: ColumnKey) => {
    setColumns((cols) => cols.map((c) => (c.key === key ? { ...c, hidden: true } : c)))
  }

  const openFilterForColumn = (key: ColumnKey) => {
    const field = availableFilterFields.find((f) => f.key === key)
    if (!field) return
    const existing = appliedFilters.find((f) => f.field === key)
    handleSelectFilterField(field, existing)
    setShowAddFilterPanel(false)
  }

  const pinColumn = (key: ColumnKey, side: "left" | "right") => {
    setColumns((cols) => cols.map((c) => (c.key === key ? { ...c, pinned: side } : c)))
  }

  const unpinColumn = (key: ColumnKey) => {
    setColumns((cols) => cols.map((c) => (c.key === key ? { ...c, pinned: undefined } : c)))
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      updateUrlWithPagination(page, pageSize, sortColumn, sortDirection)
    }
  }
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      updateUrlWithPagination(newPage, pageSize, sortColumn, sortDirection)
    }
  }
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      updateUrlWithPagination(newPage, pageSize, sortColumn, sortDirection)
    }
  }

  const handleRefresh = useCallback(() => {
    setAppliedFilters([])
    setSearchTerm("")
    setCurrentPage(1)
    setPageSize(10)
    setSortColumn("name")
    setSortDirection("asc")
    updateUrlWithPagination(1, 10, "name", "asc")
  }, [setSearchTerm, updateUrlWithPagination])

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

  const getSortIcon = (columnKey: ColumnKey) => {
    if (sortColumn === columnKey) {
      if (sortDirection === "asc") return <ArrowUp className="h-4 w-4" />
      if (sortDirection === "desc") return <ArrowDown className="h-4 w-4" />
    }
    return <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
  }

  const handleEditClick = (item: FluxData) => {
    // Use the new openBlade function from context
    openBlade(String(item.id), item.name || `Report ${item.id}`)
  }

  const handleViewClick = (item: FluxData) => {
    openViewBlade(String(item.id), item.name || `Report ${item.id}`)
  }

  const { showCustomNotification, hideCustomNotification } = useTestNotification()

  const handleRenameClick = (item: FluxData) => {
    setSelectedItemForRename(item)
    setRenameValue(item.name || `Report ${item.id}`)
    setIsRenameDialogOpen(true)
  }

  const handleRenameConfirm = async () => {
    if (!selectedItemForRename) return

    const oldName = selectedItemForRename.name || `Report ${selectedItemForRename.id}`
    const newName = renameValue.trim()
    if (!newName || newName === oldName) {
      setIsRenameDialogOpen(false)
      return
    }

    await fetch(`/api/reports/${selectedItemForRename.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    })

    // Update the local data
    setReportsData((prev) =>
      prev.map((report) => (report.id === selectedItemForRename.id ? { ...report, name: newName } : report)),
    )

    setIsRenameDialogOpen(false)
    setSelectedItemForRename(null)

    const undoAction: NotificationAction = {
      label: "Undo",
      variant: "destructive",
      onClick: async () => {
        await fetch(`/api/reports/${selectedItemForRename.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: oldName }),
        })
        setReportsData((prev) =>
          prev.map((report) => (report.id === selectedItemForRename.id ? { ...report, name: oldName } : report)),
        )
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

  const renderCell = (item: FluxData, columnKey: ColumnKey) => {
    const cellContent = item[columnKey as keyof FluxData]
    const isTruncatable = ["name", "financialType", "lastFetchingDate", "lastProcessingDate"].includes(columnKey)

    const renderTruncatedText = (text: string) => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="truncate max-w-[150px] inline-block">{text}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )

    switch (columnKey) {
      case "fluxType":
        const FluxIconComponent = fluxTypeIcons[item.fluxType as keyof typeof fluxTypeIcons]
        return (
          <div className="flex items-center justify-center">
            {FluxIconComponent ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FluxIconComponent
                      className={cn("h-5 w-5", commonStatusMap[item.fluxType]?.colorClass || "text-[#5499a2]")}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.fluxType}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span className="text-sm">{item.fluxType}</span>
            )}
          </div>
        )
      case "fluxState":
        const fluxStateConfig = commonStatusMap[item.fluxState]
        if (fluxStateConfig) {
          const IconComponent = fluxStateConfig.icon
          return (
            <div className="flex items-center justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconComponent className={cn("h-5 w-5", fluxStateConfig.colorClass)} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{fluxStateConfig.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        } else {
          return <span className="text-sm">{item.fluxState}</span>
        }
      case "fetchingStatus":
        const fetchingStatusConfig = commonStatusMap[item.fetchingStatus]
        if (fetchingStatusConfig) {
          const IconComponent = fetchingStatusConfig.icon
          return (
            <div className="flex items-center justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconComponent className={cn("h-5 w-5", fetchingStatusConfig.colorClass)} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{fetchingStatusConfig.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        } else {
          return <span className="text-sm">{item.fetchingStatus}</span>
        }
      case "numberOfErrorFetching":
        return (
          <span className={cn("font-medium", item.numberOfErrorFetching > 0 ? "text-red-600" : "text-gray-600")}>
            {item.numberOfErrorFetching}
          </span>
        )
      case "name":
      case "financialType":
        return renderTruncatedText(String(cellContent))
      case "lastFetchingDate":
      case "lastProcessingDate": {
        let formatted = String(cellContent)
        if (cellContent) {
          try {
            const d = parse(String(cellContent), "MMM d, yyyy 'at' HH:mm", new Date())
            formatted = format(d, "dd MMM yyyy HH:mm")
          } catch {}
        }
        return isMobileView ? renderTruncatedText(formatted) : <span>{formatted}</span>
      }
      case "actions":
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
                        onClick={() => handleViewClick(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                        onClick={() => handleEditClick(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fetch</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                        <Zap className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Force Process all fetching</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
            <DropdownMenu onOpenChange={(isOpen) => setOpenDropdownRowId(isOpen ? item.id : null)}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuItem onSelect={() => handleViewClick(item)}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditClick(item)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleRenameClick(item)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Make a copy</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Fetch</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Zap className="mr-2 h-4 w-4" />
                  <span>Force Process all fetching</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <History className="mr-2 h-4 w-4" />
                  <span>View fetching history</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>View processing history</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bug className="mr-2 h-4 w-4" />
                  <span>View error logs</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>View financial data points</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  <span>View workflow details</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Remove</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      default:
        return <span>{String(cellContent)}</span>
    }
  }

  function renderSpecificFilterContent() {
    if (!selectedFilterField) return null

    switch (selectedFilterField.type) {
      case "text":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="textOperator" className="text-sm font-medium block">
                Operator
              </label>
              <Select value={textFilterOperator} onValueChange={setTextFilterOperator}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="startsWith">Starts with</SelectItem>
                  <SelectItem value="endsWith">Ends with</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="textValue" className="text-sm font-medium block">
                Value
              </label>
              <Input
                ref={textInputRef}
                type="text"
                id="textValue"
                placeholder="Enter text"
                value={textFilterValue}
                onChange={(e) => setTextFilterValue(e.target.value)}
                onKeyDown={handleSpecificFilterKeyDown}
              />
            </div>
          </div>
        )
      case "number":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="numberOperator" className="text-sm font-medium block">
                Operator
              </label>
              <Select value={numberFilterOperator} onValueChange={setNumberFilterOperator}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="greaterThan">Greater than</SelectItem>
                  <SelectItem value="lessThan">Less than</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="numberValue" className="text-sm font-medium block">
                Value
              </label>
              <Input
                ref={numberInputRef}
                type="number"
                id="numberValue"
                placeholder="Enter number"
                value={numberFilterValue}
                onChange={(e) => setNumberFilterValue(e.target.value)}
                onKeyDown={handleSpecificFilterKeyDown}
              />
            </div>
          </div>
        )
      case "select":
        const options = getSelectOptions(selectedFilterField.key)
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block">Options</label>
              <div className="space-y-1">
                {options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`select-${option}`}
                      checked={selectedOptions.includes(option)}
                      onCheckedChange={() => handleOptionToggle(option)}
                    />
                    <label
                      htmlFor={`select-${option}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      case "date":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="dateOperator" className="text-sm font-medium block">
                Operator
              </label>
              <Select value={dateFilterOperator} onValueChange={setDateFilterOperator}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="before">Before</SelectItem>
                  <SelectItem value="after">After</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="dateValue" className="text-sm font-medium block">
                Date
              </label>
              <Input
                ref={dateInputRef}
                type="date"
                id="dateValue"
                value={dateFilterValue}
                onChange={(e) => setDateFilterValue(e.target.value)}
                onKeyDown={handleSpecificFilterKeyDown}
              />
            </div>
          </div>
        )
      default:
        return <p>No filter content available for this field type.</p>
    }
  }

  if (!isDataLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#5499a2]" />
          <span className="text-lg text-[#505050]">Loading data...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        [data-radix-popper-content-wrapper] {
          z-index: 10050 !important;
        }
        .fixed.inset-0[data-state="open"] {
          z-index: 10040 !important;
          background-color: rgba(0, 0, 0, 0.6) !important;
        }
        [data-radix-dialog-overlay] {
          z-index: 10040 !important;
          background-color: rgba(0, 0, 0, 0.6) !important;
        }
      `}</style>
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

      {showLoadingTooltip && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-md shadow-lg p-2 px-4 text-sm font-medium">
          Loading...
        </div>
      )}

      {showSavedFiltersPanel && (
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
                ref={savedFiltersInputRef}
                placeholder="Enter filter name..."
                value={filterNameInput}
                onChange={(e) => setFilterNameInput(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {savedFilters.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No saved filters to show</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedFilters.map((filter) => (
                    <div
                      key={filter.id}
                      className="flex items-center justify-between p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredFilterId(filter.id)}
                      onMouseLeave={() => setHoveredFilterId(null)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-[#040404]">{filter.name}</p>
                        <p className="text-xs text-gray-500">{new Date(filter.createdAt).toLocaleDateString()}</p>
                      </div>
                      {hoveredFilterId === filter.id && (
                        <Button
                          variant="ghost"
                          size="icon"
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
                disabled={!filterNameInput.trim()}
                className="w-full bg-[#5499a2] hover:bg-[#5499a2]/90 text-white disabled:bg-gray-300 disabled:text-gray-500"
              >
                Save filter
              </Button>
            </div>
          </div>
        </>
      )}

      {(showAddFilterPanel || showSpecificFilterPanel) && (
        <>
          <div
            className={cn(
              "fixed inset-0 bg-black transition-opacity duration-600 z-[9998]",
              showAddFilterPanel || showSpecificFilterPanel ? "bg-opacity-50" : "bg-opacity-0",
            )}
            onClick={() => {
              setShowAddFilterPanel(false)
              setShowSpecificFilterPanel(false)
              setSelectedFilterField(null)
              setEditingFilter(null)
            }}
          />
          {showAddFilterPanel && !editingFilter && (
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
                  {availableFilterFields.map((field) => {
                    const isApplied = isFilterFieldApplied(field.key)
                    return (
                      <div
                        key={field.key}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md border border-gray-200 transition-colors",
                          showSpecificFilterPanel
                            ? "cursor-not-allowed opacity-50"
                            : isApplied
                              ? "cursor-not-allowed opacity-50 bg-gray-50"
                              : "hover:bg-gray-50 cursor-pointer",
                        )}
                        onClick={() => !showSpecificFilterPanel && !isApplied && handleSelectFilterField(field)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className={cn("font-medium", isApplied ? "text-gray-500" : "text-[#040404]")}>
                              {field.label}
                            </p>
                            {isApplied && <Check className="h-4 w-4 text-green-600" />}
                          </div>
                          <p className={cn("text-xs capitalize", isApplied ? "text-gray-400" : "text-gray-500")}>
                            {isApplied ? "Already applied" : `${field.type} filter`}
                          </p>
                        </div>
                        <div className={cn("text-gray-400", isApplied && "opacity-50")}>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          {showAddFilterPanel && !editingFilter && showSpecificFilterPanel && (
            <div
              className="fixed top-0 left-0 md:right-96 right-0 h-full bg-black bg-opacity-10 transition-opacity duration-600 z-[9999]"
              onClick={() => {
                setShowSpecificFilterPanel(false)
                setSelectedFilterField(null)
              }}
            />
          )}
          {showSpecificFilterPanel && selectedFilterField && (
            <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300 z-[10000]">
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
          )}
        </>
      )}

      <div className="space-y-6 pb-5">
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex-grow min-w-0">
            <HorizontalScroller>
              <div className="flex items-center space-x-2 py-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setShowSavedFiltersPanel(true)}
                        className={cn(
                          "h-9 text-sm px-3 py-2 flex-shrink-0",
                          showSavedFiltersPanel
                            ? "bg-blue-100 border-blue-300 text-blue-700"
                            : "bg-white hover:bg-gray-100",
                        )}
                      >
                        <Bookmark className="h-4 w-4 mr-2" />
                        Saved Filters
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Manage saved filters</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

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
                        setAppliedFilters((prev) => prev.filter((f) => f.id !== filter.id))
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
                  className="h-9 text-sm px-3 py-2 border border-dashed border-[#D1D5DB] bg-[#F3F4F6] text-[#5A5D5D] hover:bg-[#E5E7EB] flex-shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2 text-[#5A5D5D]" />
                  Add filter
                </Button>

                {appliedFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setAppliedFilters([])}
                    className="h-9 text-sm px-3 py-2 text-[#5499a2] hover:text-[#3d7a82] hover:bg-[#f0f9fa] flex-shrink-0"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </HorizontalScroller>
          </div>
          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="flex items-center space-x-2 text-sm text-[#505050]">
              <span>
                <span className="hidden sm:inline">
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalReportsCount)} of{" "}
                  {totalReportsCount}
                </span>
                <span className="sm:hidden">
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalReportsCount)} of{" "}
                  {totalReportsCount > 999 ? "..." : totalReportsCount}
                </span>
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
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={goToNextPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-[#f0f9fa] hover:text-[#3d7a82] transition-all duration-200"
              onClick={handleRefresh}
              aria-label="Refresh data"
            >
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

        <div className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto relative">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Table>
                    <TableHeader>
                      <Droppable droppableId="columns-reports" direction="horizontal">
                        {(provided) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            {getOrderedColumns().map((column, index) => (
                              <Draggable
                                key={column.key}
                                draggableId={column.key}
                                index={index}
                                isDragDisabled={!column.draggable}
                              >
                                {(providedDraggable, snapshot) => (
                                  <TableHead
                                    ref={providedDraggable.innerRef}
                                    {...providedDraggable.draggableProps}
                                    className={cn(
                                      `group ${snapshot.isDragging ? "bg-[#f9fafb]" : ""}`,
                                      column.key === "actions" && "w-[220px] text-right pr-4",
                                      column.pinned === "left" && "sticky left-0 z-10 bg-white",
                                      column.pinned === "right" && "sticky right-0 z-10 bg-white",
                                    )}
                                  >
                                    <TableColumnHeader
                                      label={column.label}
                                      columnKey={column.key}
                                      sortable={column.sortable}
                                      draggable={column.draggable}
                                      dragHandleProps={providedDraggable.dragHandleProps}
                                      getSortIcon={getSortIcon}
                                      onSort={handleSort}
                                      onSortAsc={handleSortAsc}
                                      onSortDesc={handleSortDesc}
                                      onFilter={openFilterForColumn}
                                      showFilter={availableFilterFields.some((f) => f.key === column.key)}
                                      filterDisabled={!availableFilterFields.some((f) => f.key === column.key)}
                                      pinned={column.pinned ?? null}
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
                      {reportsData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={getOrderedColumns().length} className="h-24 text-center text-gray-500">
                            No data found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        reportsData.map((item) => (
                          <ContextMenu key={item.id}>
                            <ContextMenuTrigger asChild>
                              <TableRow
                                className="border-b border-[#f5f5f5] hover:bg-[#f9fafb]"
                                onMouseEnter={() => setHoveredRowId(item.id)}
                                onMouseLeave={() => setHoveredRowId(null)}
                              >
                                {getOrderedColumns().map((column) => (
                                  <TableCell
                                    key={column.key}
                                    className={cn(
                                      "text-[#040404]",
                                      column.key === "actions" && "w-[220px] text-right pr-4",
                                      column.pinned === "left" && "sticky left-0 z-10 bg-white",
                                      column.pinned === "right" && "sticky right-0 z-10 bg-white",
                                    )}
                                  >
                                    {renderCell(item, column.key)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-64">
                              <ContextMenuItem onSelect={() => handleViewClick(item)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View</span>
                              </ContextMenuItem>
                              <ContextMenuItem onClick={() => handleEditClick(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </ContextMenuItem>
                              <ContextMenuItem onSelect={() => handleRenameClick(item)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Rename</span>
                              </ContextMenuItem>
                              <ContextMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                <span>Make a copy</span>
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem>
                                <Zap className="mr-2 h-4 w-4" />
                                <span>Fetch</span>
                              </ContextMenuItem>
                              <ContextMenuItem>
                                <Zap className="mr-2 h-4 w-4" />
                                <span>Force Process all fetching</span>
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem>
                                <History className="mr-2 h-4 w-4" />
                                <span>View fetching history</span>
                              </ContextMenuItem>
                              <ContextMenuItem>
                                <Clock className="mr-2 h-4 w-4" />
                                <span>View processing history</span>
                              </ContextMenuItem>
                              <ContextMenuItem>
                                <Bug className="mr-2 h-4 w-4" />
                                <span>View error logs</span>
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem>
                                <DollarSign className="mr-2 h-4 w-4" />
                                <span>View financial data points</span>
                              </ContextMenuItem>
                              <ContextMenuItem>
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                <span>View workflow details</span>
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Remove</span>
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </DragDropContext>
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e2e2]">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-[#505050]">Items per page:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value))
                      setCurrentPage(1)
                      updateUrlWithPagination(1, Number(value), sortColumn, sortDirection)
                    }}
                  >
                    <SelectTrigger className="w-[80px] h-8 text-sm">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      {pageSizeOptions.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-[#505050]">
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalReportsCount)} of{" "}
                  {totalReportsCount}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    disabled={currentPage === 1}
                    onClick={() => goToPage(1)}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    disabled={currentPage === 1}
                    onClick={goToPreviousPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-[#505050] px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={goToNextPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => goToPage(totalPages)}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ColumnsPanel
        open={showColumnsPanel}
        columns={columns}
        onClose={() => setShowColumnsPanel(false)}
        onChange={setColumns}
      />
    </>
  )

  function handleSelectFilterField(field: FilterField, existingFilter?: AppliedFilter) {
    if (!existingFilter && isFilterFieldApplied(field.key)) return
    setSelectedFilterField(field)
    setShowSpecificFilterPanel(true)
    if (existingFilter) {
      setEditingFilter(existingFilter)
      switch (field.type) {
        case "text":
          setTextFilterValue(String(existingFilter.value))
          setTextFilterOperator(existingFilter.operator)
          break
        case "number":
          setNumberFilterValue(String(existingFilter.value))
          setNumberFilterOperator(existingFilter.operator)
          break
        case "select":
          setSelectedOptions(
            Array.isArray(existingFilter.value) ? existingFilter.value : [String(existingFilter.value)],
          )
          break
        case "date":
          setDateFilterValue(String(existingFilter.value))
          setDateFilterOperator(existingFilter.operator)
          break
      }
    } else {
      setEditingFilter(null)
      setTextFilterValue("")
      setTextFilterOperator("contains")
      setNumberFilterValue("")
      setNumberFilterOperator("equals")
      setSelectedOptions([])
      setDateFilterValue("")
      setDateFilterOperator("equals")
    }
  }

  function handleBackToFilterList() {
    setShowSpecificFilterPanel(false)
    setSelectedFilterField(null)
  }

  async function handleApplySpecificFilter() {
    if (!selectedFilterField) return
    setShowLoadingTooltip(true)
    try {
      let filterValue: any
      let operator: string
      let label: string
      switch (selectedFilterField.type) {
        case "text":
          if (!textFilterValue.trim()) return
          filterValue = textFilterValue.trim()
          operator = textFilterOperator
          label = `${selectedFilterField.label} ${textFilterOperator} "${textFilterValue}"`
          break
        case "number":
          if (!numberFilterValue.trim()) return
          filterValue = Number(numberFilterValue)
          operator = numberFilterOperator
          label = `${selectedFilterField.label} ${numberFilterOperator} ${numberFilterValue}`
          break
        case "select":
          if (selectedOptions.length === 0) return
          filterValue = selectedOptions
          operator = "in"
          label = `${
            selectedOptions.length === 1
              ? selectedOptions[0]
              : selectedFilterField.label + " in [" + selectedOptions.join(", ") + "]"
          }`
          break
        case "date":
          if (!dateFilterValue) return
          filterValue = dateFilterValue
          operator = dateFilterOperator
          label = `${selectedFilterField.label} ${dateFilterOperator} ${dateFilterValue}`
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
      updateUrlWithPagination(1, pageSize, sortColumn, sortDirection)
      setShowSpecificFilterPanel(false)
      setShowAddFilterPanel(false)
      setSelectedFilterField(null)
      setEditingFilter(null)
    } catch (error) {
      console.error("Error applying specific filter:", error)
    } finally {
      setShowLoadingTooltip(false)
    }
  }

  function handleEditFilter(filter: AppliedFilter) {
    const field = availableFilterFields.find((f) => f.key === filter.field)
    if (!field) return
    setSelectedFilterField(field)
    setEditingFilter(filter)
    switch (field.type) {
      case "text":
        setTextFilterValue(String(filter.value))
        setTextFilterOperator(filter.operator)
        break
      case "number":
        setNumberFilterValue(String(filter.value))
        setNumberFilterOperator(filter.operator)
        break
      case "select":
        setSelectedOptions(Array.isArray(filter.value) ? filter.value : [String(filter.value)])
        break
      case "date":
        setDateFilterValue(String(filter.value))
        setDateFilterOperator(filter.operator)
        break
    }
    setShowSpecificFilterPanel(true)
    setShowAddFilterPanel(false)
  }

  function getSelectOptions(fieldKey: string) {
    switch (fieldKey) {
      case "fluxState":
        return stageOptions
      case "financialType":
        return financialTypeOptions
      case "fluxType":
        return fluxTypeOptions
      default:
        return []
    }
  }

  function handleOptionToggle(option: string) {
    setSelectedOptions((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]))
  }
  function handleSpecificFilterKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation()
      handleApplySpecificFilter()
    }
  }
}

export default ReportsGrid
