"use client"

import { ContextMenuItem } from "@/components/ui/context-menu"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  RefreshCw,
  Columns3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Loader2,
  X,
  Eye,
  Edit,
  Pencil,
  Copy,
  Download,
  Zap,
  History,
  Clock,
  Bug,
  DollarSign,
  FileText,
  Trash2,
  MoreVertical,
} from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { dataStore, type FluxData } from "@/lib/data-store"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSearch } from "@/lib/search-context"
import { parseISO, format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangeFilter } from "@/components/filters/date-range-filter"
import { HorizontalScroller } from "@/components/horizontal-scroller"
import ColumnsPanel from "@/components/shared/ColumnsPanel"
import { cn } from "@/lib/utils" // Ensure cn is imported
import { commonStatusMap } from "@/lib/status-config" // Import common status map
import { ContextMenu, ContextMenuContent, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu" // Import ContextMenu components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu" // Import DropdownMenu components
import TableColumnHeader from "@/components/table-column-header"

type SortDirection = "asc" | "desc" | null
type ColumnKey = "id" | "name" | "stage" | "progress" | "startTime" | "duration" | "completedAt" | "status" | "actions"

interface Column {
  key: ColumnKey
  label: string
  sortable: boolean
  draggable: boolean
  hidden?: boolean
}

interface FinancialWorkflowPageProps {
  isSidebarCollapsed?: boolean
}

// Updated status options to use commonStatusMap and new order
const statusOptions = [
  { value: "all", label: "All Statuses", icon: null },
  {
    value: "completed",
    label: "Completed",
    icon: commonStatusMap.completed.icon,
    colorClass: commonStatusMap.completed.colorClass,
  },
  {
    value: "Processing",
    label: "Processing",
    icon: commonStatusMap.Processing.icon,
    colorClass: commonStatusMap.Processing.colorClass,
  },
  {
    value: "active",
    label: "Active",
    icon: commonStatusMap.active.icon,
    colorClass: commonStatusMap.active.colorClass,
  },
  {
    value: "failed",
    label: "Failed",
    icon: commonStatusMap.failed.icon,
    colorClass: commonStatusMap.failed.colorClass,
  },
  {
    value: "Partially",
    label: "Partially",
    icon: commonStatusMap.Partially.icon,
    colorClass: commonStatusMap.Partially.colorClass,
  },
  {
    value: "Paused",
    label: "Paused",
    icon: commonStatusMap.Paused.icon,
    colorClass: commonStatusMap.Paused.colorClass,
  },
]

export default function FinancialWorkflowPage({ isSidebarCollapsed }: FinancialWorkflowPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { searchTerm, filters, setSearchTerm, setFilters } = useSearch()

  const [sortColumn, setSortColumn] = useState<ColumnKey | null>("startTime")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [showLoadingTooltip, setShowLoadingTooltip] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [currentData, setCurrentData] = useState<FluxData[]>([]) // State to hold flux data
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null) // New state for row hover
  const [isLargeScreen, setIsLargeScreen] = useState(false) // New state for large screen detection
  const [openDropdownRowId, setOpenDropdownRowId] = useState<string | null>(null) // New state to track open dropdown
  const [showColumnsPanel, setShowColumnsPanel] = useState(false)

  const [columns, setColumns] = useState<Column[]>([
    { key: "id", label: "ID", sortable: true, draggable: false, hidden: false },
    { key: "name", label: "Name", sortable: true, draggable: true, hidden: false },
    { key: "stage", label: "Stage", sortable: true, draggable: true, hidden: false },
    { key: "progress", label: "Progress", sortable: true, draggable: true, hidden: false },
    { key: "startTime", label: "Start time", sortable: true, draggable: true, hidden: false },
    { key: "duration", label: "Duration (min)", sortable: true, draggable: true, hidden: false },
    { key: "completedAt", label: "Completed at", sortable: true, draggable: true, hidden: false },
    { key: "status", label: "Status", sortable: true, draggable: true, hidden: false },
    { key: "actions", label: "", sortable: false, draggable: false, hidden: false },
  ])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("financial-workflow-columns")
    if (stored) {
      try {
        setColumns(JSON.parse(stored))
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("financial-workflow-columns", JSON.stringify(columns))
    }
  }, [columns])

  const [stats, setStats] = useState(dataStore.getStats())
  const [isMobileView, setIsMobileView] = useState(false)

  const pageSizeOptions = [10, 20, 50]

  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window !== "undefined") {
        setIsMobileView(window.innerWidth < 768)
        setIsLargeScreen(window.innerWidth >= 1600) // Set large screen state
      }
    }
    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  useEffect(() => {
    const checkDataLoad = async () => {
      await dataStore.waitForLoad()
      setIsDataLoaded(true)
      setCurrentData(dataStore.getAllFlux()) // Set data after load
      setStats(dataStore.getStats())
    }
    checkDataLoad()
  }, [])

  useEffect(() => {
    const refreshStatsOnMount = () => {
      setStats(dataStore.getStats())
    }
    refreshStatsOnMount()
  }, [])

  const updateUrlWithPage = useCallback(
    (
      page: number,
      size: number,
      col: ColumnKey | null = sortColumn,
      dir: SortDirection = sortDirection,
    ) => {
      const params = new URLSearchParams(searchParams.toString())
      if (page > 1) {
        params.set("page", page.toString())
      } else {
        params.delete("page")
      }
      if (size !== 10) {
        params.set("pageSize", size.toString())
      } else {
        params.delete("pageSize")
      }
      if (col) params.set("sortColumn", col)
      else params.delete("sortColumn")
      if (dir) params.set("sortDirection", dir)
      else params.delete("sortDirection")
      const queryString = params.toString()
      const newUrl = queryString ? `/financial-workflow?${queryString}` : "/financial-workflow"
      router.replace(newUrl, { scroll: false })
    },
    [router, searchParams, sortColumn, sortDirection],
  )

  const updateUrlWithFiltersAndPage = useCallback(
    (newFilters: typeof filters, newPage?: number, newPageSize?: number) => {
      const params = new URLSearchParams()
      if (newFilters.status.length > 0) params.set("status", newFilters.status.join(","))
      if (newFilters.category.length > 0) params.set("category", newFilters.category.join(","))
      if (newFilters.progressRange) params.set("progress", newFilters.progressRange)
      if (newFilters.durationRange) params.set("duration", newFilters.durationRange)
      if (newFilters.dateRange.preset) params.set("datePreset", newFilters.dateRange.preset)
      if (newFilters.dateRange.range?.from)
        params.set("dateFrom", newFilters.dateRange.range.from.toISOString().split("T")[0])
      if (newFilters.dateRange.range?.to)
        params.set("dateTo", newFilters.dateRange.range.to.toISOString().split("T")[0])

      const finalPage = newPage === undefined ? currentPage : newPage
      if (finalPage > 1) {
        params.set("page", finalPage.toString())
      }
      const finalPageSize = newPageSize === undefined ? pageSize : newPageSize
      if (finalPageSize !== 10) {
        params.set("pageSize", finalPageSize.toString())
      }
      const queryString = params.toString()
      const newUrl = queryString ? `/financial-workflow?${queryString}` : "/financial-workflow"
      router.replace(newUrl, { scroll: false })
    },
    [
      router,
      currentPage,
      pageSize,
      filters.status,
      filters.category,
      filters.progressRange,
      filters.durationRange,
      filters.dateRange,
    ],
  )

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
      updateUrlWithPage(1, pageSize, newSortColumn, newSortDirection)
    },
    [sortColumn, sortDirection, pageSize, updateUrlWithPage],
  )

  const handleSortAsc = (columnKey: ColumnKey) => {
    setSortColumn(columnKey)
    setSortDirection("asc")
    setCurrentPage(1)
    updateUrlWithPage(1, pageSize, columnKey, "asc")
  }

  const handleSortDesc = (columnKey: ColumnKey) => {
    setSortColumn(columnKey)
    setSortDirection("desc")
    setCurrentPage(1)
    updateUrlWithPage(1, pageSize, columnKey, "desc")
  }

  const localHandleFilterChangeAndResetPage = useCallback(
    (filterType: keyof typeof filters, value: any) => {
      setShowLoadingTooltip(true)
      const newFiltersState = { ...filters, [filterType]: value }
      setFilters(newFiltersState)
      setCurrentPage(1)
      updateUrlWithFiltersAndPage(newFiltersState, 1, pageSize)
      setTimeout(() => setShowLoadingTooltip(false), 300)
    },
    [filters, setFilters, pageSize, updateUrlWithFiltersAndPage],
  )

  const clearAllFiltersAndResetPage = useCallback(() => {
    setShowLoadingTooltip(true)
    const clearedFilters = {
      status: [],
      category: [],
      progressRange: "",
      durationRange: "",
      dateRange: { preset: "", range: undefined },
    }
    setFilters(clearedFilters)
    setSearchTerm("")
    setCurrentPage(1)
    setPageSize(10) // Reset page size to default
    updateUrlWithFiltersAndPage(clearedFilters, 1, 10) // Update URL with default page and size
    setTimeout(() => setShowLoadingTooltip(false), 300)
  }, [setFilters, setSearchTerm, updateUrlWithFiltersAndPage])

  const clearSingleFilter = useCallback(
    (filterType: keyof typeof filters) => {
      setShowLoadingTooltip(true)
      const newFiltersState = {
        ...filters,
        [filterType]:
          filterType === "dateRange" ? { preset: "", range: undefined } : Array.isArray(filters[filterType]) ? [] : "",
      }
      setFilters(newFiltersState)
      setCurrentPage(1)
      updateUrlWithFiltersAndPage(newFiltersState, 1, pageSize)
      setTimeout(() => setShowLoadingTooltip(false), 300)
    },
    [filters, setFilters, pageSize, updateUrlWithFiltersAndPage],
  )

  const handleRefresh = useCallback(() => {
    setShowLoadingTooltip(true)
    dataStore.resetData()
    // Re-fetch data after reset
    dataStore.waitForLoad().then(() => {
      setCurrentData(dataStore.getAllFlux())
      setStats(dataStore.getStats())
    })
    clearAllFiltersAndResetPage() // This now handles URL reset including pageSize
    setTimeout(() => setShowLoadingTooltip(false), 500)
  }, [clearAllFiltersAndResetPage])

  useEffect(() => {
    const urlStatus = searchParams.get("status")
    const urlProgress = searchParams.get("progress")
    const urlDuration = searchParams.get("duration")
    const urlCategory = searchParams.get("category")
    const urlFilterFromDashboard = searchParams.get("filter")
    const urlDatePreset = searchParams.get("datePreset")
    const urlDateFrom = searchParams.get("dateFrom")
    const urlDateTo = searchParams.get("dateTo")

    const urlPageSize = searchParams.get("pageSize")
    const sizeNum = urlPageSize ? Number.parseInt(urlPageSize, 10) : 10
    if (sizeNum !== pageSize) {
      setPageSize(sizeNum > 0 ? sizeNum : 10)
    }

    let newStatusArray: string[] = []
    if (urlStatus) {
      newStatusArray = urlStatus
        .split(",")
        .filter((s) => ["active", "completed", "failed", "Processing", "Paused", "Partially"].includes(s))
    } else if (
      urlFilterFromDashboard &&
      ["active", "completed", "failed", "Processing", "Paused", "Partially"].includes(urlFilterFromDashboard)
    ) {
      newStatusArray = [urlFilterFromDashboard]
      const tempParams = new URLSearchParams(searchParams.toString())
      tempParams.delete("filter")
      tempParams.set("status", urlFilterFromDashboard)
      router.replace(`/financial-workflow?${tempParams.toString()}`, { scroll: false })
    }

    const newProgress = urlProgress && ["0-25", "26-50", "51-75", "76-100"].includes(urlProgress) ? urlProgress : ""
    const newDuration = urlDuration && ["0-15", "16-30", "31+"].includes(urlDuration) ? urlDuration : ""
    const newCategoryArray = urlCategory ? urlCategory.split(",").filter((cat) => cat.trim()) : []
    const newDateFilter = {
      preset: urlDatePreset || "",
      range:
        urlDateFrom || urlDateTo
          ? {
              from: urlDateFrom ? new Date(urlDateFrom) : undefined,
              to: urlDateTo ? new Date(urlDateTo) : undefined,
            }
          : undefined,
    }

    if (
      JSON.stringify(newStatusArray.sort()) !== JSON.stringify(filters.status.sort()) ||
      newProgress !== filters.progressRange ||
      newDuration !== filters.durationRange ||
      JSON.stringify(newCategoryArray.sort()) !== JSON.stringify(filters.category.sort()) ||
      JSON.stringify(newDateFilter) !== JSON.stringify(filters.dateRange)
    ) {
      setFilters({
        status: newStatusArray,
        category: newCategoryArray,
        progressRange: newProgress,
        durationRange: newDuration,
        dateRange: newDateFilter,
      })
    }

    const urlPage = searchParams.get("page")
    const pageNum = urlPage ? Number.parseInt(urlPage, 10) : 1
    if (pageNum !== currentPage) {
      setCurrentPage(pageNum > 0 ? pageNum : 1)
    }
  }, [searchParams, router, filters, setFilters, currentPage, pageSize])

  const applyFilters = useCallback(
    (data: FluxData[]) => {
      let filtered = data
      if (filters.status.length > 0) filtered = filtered.filter((item) => filters.status.includes(item.status))
      if (filters.category.length > 0) filtered = filtered.filter((item) => filters.category.includes(item.category))
      if (filters.progressRange) {
        switch (filters.progressRange) {
          case "0-25":
            filtered = filtered.filter((item) => item.progress >= 0 && item.progress <= 25)
            break
          case "26-50":
            filtered = filtered.filter((item) => item.progress >= 26 && item.progress <= 50)
            break
          case "51-75":
            filtered = filtered.filter((item) => item.progress >= 51 && item.progress <= 75)
            break
          case "76-100":
            filtered = filtered.filter((item) => item.progress >= 76 && item.progress <= 100)
            break
        }
      }
      if (filters.durationRange) {
        switch (filters.durationRange) {
          case "0-15":
            filtered = filtered.filter((item) => item.duration >= 0 && item.duration <= 15)
            break
          case "16-30":
            filtered = filtered.filter((item) => item.duration >= 16 && item.progress <= 30)
            break
          case "31+":
            filtered = filtered.filter((item) => item.duration >= 31)
            break
        }
      }
      if (filters.dateRange.range?.from) {
        const fromDate = filters.dateRange.range.from
        filtered = filtered.filter((item) => parseISO(item.createdAt) >= fromDate)
      }
      if (filters.dateRange.range?.to) {
        const toDate = filters.dateRange.range.to
        filtered = filtered.filter((item) => parseISO(item.createdAt) <= toDate)
      }
      return filtered
    },
    [filters],
  )

  const filteredAndSortedData = useMemo(() => {
    let dataToProcess = applyFilters(currentData) // Use currentData from state
    if (searchTerm.trim()) {
      dataToProcess = dataToProcess.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (sortColumn && sortDirection) {
      dataToProcess = [...dataToProcess].sort((a, b) => {
        let aVal: any = a[sortColumn]
        let bVal: any = b[sortColumn]
        if (sortColumn === "progress" || sortColumn === "duration") {
          aVal = Number(aVal)
          bVal = Number(bVal)
        } else if (sortColumn === "id") {
          // For string IDs like "flux-001", compare numerically if possible
          const aNum = Number.parseInt(String(aVal).replace(/\D/g, ""), 10)
          const bNum = Number.parseInt(String(bVal).replace(/\D/g, ""), 10)
          if (!isNaN(aNum) && !isNaN(bNum)) {
            aVal = aNum
            bVal = bNum
          }
        } else if (sortColumn === "startTime" || sortColumn === "completedAt") {
          // Add completedAt here
          // Compare dates
          aVal = new Date(aVal)
          bVal = new Date(bVal)
        }

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }
    return dataToProcess
  }, [currentData, searchTerm, sortColumn, sortDirection, applyFilters]) // Add currentData to dependencies

  useEffect(() => {
    const newTotalPages = Math.ceil(filteredAndSortedData.length / pageSize) || 1
    setTotalPages(newTotalPages)

    if (currentPage > newTotalPages && filteredAndSortedData.length > 0) {
      const newCurrentPage = Math.max(1, Math.min(currentPage, newTotalPages))
      setCurrentPage(newCurrentPage)
      if (newCurrentPage !== currentPage) {
        updateUrlWithPage(newCurrentPage, pageSize) // Pass pageSize
      }
    } else if (currentPage === 0 && filteredAndSortedData.length > 0) {
      setCurrentPage(1)
      updateUrlWithPage(1, pageSize) // Pass pageSize
    } else if (filteredAndSortedData.length === 0 && currentPage !== 1) {
      setCurrentPage(1)
      updateUrlWithPage(1, pageSize) // Pass pageSize
    }
  }, [filteredAndSortedData, pageSize, currentPage, updateUrlWithPage])

  const paginatedData = useMemo(() => {
    return filteredAndSortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredAndSortedData, currentPage, pageSize])

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page)
        updateUrlWithPage(page, pageSize) // Pass pageSize
      }
    },
    [totalPages, pageSize, updateUrlWithPage],
  )

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      updateUrlWithPage(newPage, pageSize) // Pass pageSize
    }
  }, [currentPage, pageSize, updateUrlWithPage])

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      updateUrlWithPage(newPage, pageSize) // Pass pageSize
    }
  }, [currentPage, totalPages, pageSize, updateUrlWithPage])

  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    const items = Array.from(columns)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    setColumns(items)
  }

  const getSortIcon = (columnKey: ColumnKey) => {
    if (sortColumn === columnKey) {
      if (sortDirection === "asc") return <ArrowUp className="h-4 w-4" />
      if (sortDirection === "desc") return <ArrowDown className="h-4 w-4" />
    }
    return <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
  }

  const renderCell = (item: FluxData, columnKey: ColumnKey) => {
    switch (columnKey) {
      case "progress":
        return (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-[#505050] w-12">{item.progress}%</span>
            <Progress value={item.progress} className="w-24 h-2" />
          </div>
        )
      case "duration":
        return <span>{item.duration} min</span>
      case "completedAt":
        return item.completedAt ? (
          <span>{format(parseISO(item.completedAt), "dd.MM.yyyy HH:mm")}</span>
        ) : (
          <span>N/A</span>
        )
      case "status":
        const statusConfig = commonStatusMap[item.status]
        if (statusConfig) {
          const IconComponent = statusConfig.icon
          return (
            <div className="flex justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconComponent className={cn("h-5 w-5", statusConfig.colorClass)} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="capitalize">{statusConfig.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        }
        return <span>{item.status}</span> // Fallback if status not found in map
      case "name":
        return <span className="font-medium">{item[columnKey]}</span>
      case "actions": // Render for the new actions column
        return (
          <div className="flex items-center justify-end space-x-1 pr-2">
            {isLargeScreen && (hoveredRowId === item.id || openDropdownRowId === item.id) && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
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
                <DropdownMenuItem onClick={() => console.log(`View ${item.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log(`Edit ${item.id}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log(`Rename ${item.id}`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log(`Make a copy of ${item.id}`)}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Make a copy</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log(`Fetch ${item.id}`)}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Fetch</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log(`Force Process all fetching for ${item.id}`)}>
                  <Zap className="mr-2 h-4 w-4" />
                  <span>Force Process all fetching</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log(`View fetching history for ${item.id}`)}>
                  <History className="mr-2 h-4 w-4" />
                  <span>View fetching history</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log(`View processing history for ${item.id}`)}>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>View processing history</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log(`View error logs for ${item.id}`)}>
                  <Bug className="mr-2 h-4 w-4" />
                  <span>View error logs</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log(`View financial data points for ${item.id}`)}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>View financial data points</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log(`View workflow details for ${item.id}`)}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>View workflow details</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => console.log(`Remove ${item.id}`)}
                  className="text-red-600 focus:bg-red-100 focus:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Remove</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      default:
        return <span>{item[columnKey]}</span>
    }
  }

  const selectedStatusValue = filters.status.length === 1 ? filters.status[0] : "all"
  // Updated logic for active filters
  const isStatusFilterActive = filters.status.length > 0
  const isProgressFilterActive = filters.progressRange !== ""
  const isDurationFilterActive = filters.durationRange !== ""
  const isDateFilterActive =
    filters.dateRange.preset !== "" || filters.dateRange.range?.from || filters.dateRange.range?.to

  const clearStatusFilter = () => clearSingleFilter("status")
  const clearProgressFilter = () => clearSingleFilter("progressRange")
  const clearDurationFilter = () => clearSingleFilter("durationRange")

  const getStatusDisplayText = () => statusOptions.find((opt) => opt.value === selectedStatusValue)?.label || "Status"
  const getProgressDisplayText = () => {
    switch (filters.progressRange) {
      case "0-25":
        return "0% - 25%"
      case "26-50":
        return "26% - 50%"
      case "51-75":
        return "51% - 75%"
      case "76-100":
        return "76% - 100%"
      default:
        return "Progress"
    }
  }
  const getDurationDisplayText = () => {
    switch (filters.durationRange) {
      case "0-15":
        return "0 - 15 min"
      case "16-30":
        return "16 - 30 min"
      case "31+":
        return "30+ min"
      default:
        return "Duration"
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
      {showLoadingTooltip && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-md shadow-lg p-2 px-4 text-sm font-medium">
          Loading...
        </div>
      )}
      <div className="space-y-6 pb-5">
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex-grow min-w-0">
            <HorizontalScroller>
              <div className="flex items-center space-x-2 py-1">
                {/* Status Filter */}
                <div className="flex items-center flex-shrink-0">
                  <Select
                    value={selectedStatusValue}
                    onValueChange={(value) =>
                      localHandleFilterChangeAndResetPage("status", value === "all" ? [] : [value])
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        "w-auto text-sm h-9 pl-3 pr-3 py-2 min-w-[120px] flex-shrink-0 font-normal",
                        isStatusFilterActive
                          ? "bg-blue-100 border-blue-300 text-blue-700 rounded-l-md rounded-r-none border-r-0 hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          : "bg-white border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                      )}
                    >
                      <span className="whitespace-nowrap">{getStatusDisplayText()}</span>
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center">
                            {opt.icon && <opt.icon className={cn("h-4 w-4 mr-2", opt.colorClass)} />}
                            <span>{opt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isStatusFilterActive && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-blue-100 border-blue-300 text-blue-700 rounded-r-md rounded-l-none h-9 w-9 hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      onClick={clearStatusFilter}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Progress Filter */}
                <div className="flex items-center flex-shrink-0">
                  <Select
                    value={filters.progressRange || "all"}
                    onValueChange={(value) =>
                      localHandleFilterChangeAndResetPage("progressRange", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        "w-auto text-sm h-9 pl-3 pr-3 py-2 min-w-[120px] flex-shrink-0 font-normal",
                        isProgressFilterActive
                          ? "bg-blue-100 border-blue-300 text-blue-700 rounded-l-md rounded-r-none border-r-0 hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          : "bg-white border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                      )}
                    >
                      <span className="whitespace-nowrap">{getProgressDisplayText()}</span>
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      <SelectItem value="all">All Progress</SelectItem>
                      <SelectItem value="0-25">0% - 25%</SelectItem>
                      <SelectItem value="26-50">26% - 50%</SelectItem>
                      <SelectItem value="51-75">51% - 75%</SelectItem>
                      <SelectItem value="76-100">76% - 100%</SelectItem>
                    </SelectContent>
                  </Select>
                  {isProgressFilterActive && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-blue-100 border-blue-300 text-blue-700 rounded-r-md rounded-l-none h-9 w-9 hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      onClick={clearProgressFilter}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Duration Filter */}
                <div className="flex items-center flex-shrink-0">
                  <Select
                    value={filters.durationRange || "all"}
                    onValueChange={(value) =>
                      localHandleFilterChangeAndResetPage("durationRange", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        "w-auto text-sm h-9 pl-3 pr-3 py-2 min-w-[120px] flex-shrink-0 font-normal",
                        isDurationFilterActive
                          ? "bg-blue-100 border-blue-300 text-blue-700 rounded-l-md rounded-r-none border-r-0 hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          : "bg-white border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                      )}
                    >
                      <span className="whitespace-nowrap">{getDurationDisplayText()}</span>
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      <SelectItem value="all">All Durations</SelectItem>
                      <SelectItem value="0-15">0 - 15 min</SelectItem>
                      <SelectItem value="16-30">16 - 30 min</SelectItem>
                      <SelectItem value="31+">30+ min</SelectItem>
                    </SelectContent>
                  </Select>
                  {isDurationFilterActive && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-blue-100 border-blue-300 text-blue-700 rounded-r-md rounded-l-none h-9 w-9 hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      onClick={clearDurationFilter}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Date Range Filter */}
                <div className="flex-shrink-0">
                  <DateRangeFilter
                    value={filters.dateRange}
                    onValueChange={(value) => localHandleFilterChangeAndResetPage("dateRange", value)}
                  />
                </div>
                {(isStatusFilterActive || isProgressFilterActive || isDurationFilterActive || isDateFilterActive) && (
                  <button
                    onClick={clearAllFiltersAndResetPage}
                    className="ml-2 px-3 py-2 text-sm text-[#5499a2] hover:text-[#3d7a82] hover:bg-[#f0f9fa] rounded-md transition-all duration-200 font-medium border border-transparent hover:border-[#d1ecef] flex-shrink-0"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </HorizontalScroller>
          </div>
          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="flex items-center space-x-2 text-sm text-[#505050]">
              <span>
                {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredAndSortedData.length)} of{" "}
                {filteredAndSortedData.length}
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
              variant="ghost" // Promenjeno u ghost varijantu
              size="icon" // Promenjeno u icon veličinu
              className="h-8 w-8 hover:bg-[#f0f9fa] hover:text-[#3d7a82] transition-all duration-200" // Ažurirane klase za izgled
              onClick={handleRefresh}
              aria-label="Refresh data"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" /> {/* Ikonica je sada siva */}
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
                    <TableHeader className="bg-white">
                      <Droppable droppableId="columns-financial-workflow" direction="horizontal">
                        {(provided) => (
                          <TableRow
                            className="border-b border-[#e2e2e2]"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            {columns.filter((c) => !c.hidden).map((column, index) => (
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
                                      `text-[#505050] font-medium group ${snapshot.isDragging ? "bg-[#f9fafb]" : ""}`,
                                      column.key === "actions" && "w-[220px] text-right pr-4",
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
                      {paginatedData.map((item) => (
                        <ContextMenu key={item.id}>
                          <ContextMenuTrigger asChild>
                            <TableRow
                              className="border-b border-[#f5f5f5] hover:bg-[#f9fafb]"
                              onMouseEnter={() => setHoveredRowId(item.id)}
                              onMouseLeave={() => setHoveredRowId(null)}
                            >
                              {columns.filter((c) => !c.hidden).map((column) => (
                                <TableCell
                                  key={column.key}
                                  className={cn(
                                    "text-[#040404]",
                                    column.key === "actions" && "w-[220px] text-right pr-4", // Updated width
                                  )}
                                >
                                  {renderCell(item, column.key)}
                                </TableCell>
                              ))}
                            </TableRow>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-64">
                            {" "}
                            {/* Adjusted width */}
                            <ContextMenuItem onClick={() => console.log(`View ${item.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => console.log(`Edit ${item.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => console.log(`Rename ${item.id}`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Rename</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => console.log(`Make a copy of ${item.id}`)}>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Make a copy</span>
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => console.log(`Fetch ${item.id}`)}>
                              <Download className="mr-2 h-4 w-4" />
                              <span>Fetch</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => console.log(`Force Process all fetching for ${item.id}`)}>
                              <Zap className="mr-2 h-4 w-4" />
                              <span>Force Process all fetching</span>
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => console.log(`View fetching history for ${item.id}`)}>
                              <History className="mr-2 h-4 w-4" />
                              <span>View fetching history</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => console.log(`View processing history for ${item.id}`)}>
                              <Clock className="mr-2 h-4 w-4" />
                              <span>View processing history</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => console.log(`View error logs for ${item.id}`)}>
                              <Bug className="mr-2 h-4 w-4" />
                              <span>View error logs</span>
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => console.log(`View financial data points for ${item.id}`)}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              <span>View financial data points</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => console.log(`View workflow details for ${item.id}`)}>
                              <FileText className="mr-2 h-4 w-4" />
                              <span>View workflow details</span>
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              onClick={() => console.log(`Remove ${item.id}`)}
                              className="text-red-600 focus:bg-red-100 focus:text-red-700"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Remove</span>
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                    </TableBody>
                  </Table>
                </DragDropContext>
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e2e2]">
                <div className="flex items-center space-x-2">
                  {" "}
                  {/* Added wrapper for items per page */}
                  <span className="text-sm text-[#505050]">Items per page:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value))
                      setCurrentPage(1) // Reset to first page
                      updateUrlWithPage(1, Number(value)) // Update URL
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
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredAndSortedData.length)} of{" "}
                  {filteredAndSortedData.length}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === 1}
                    onClick={() => goToPage(1)}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
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
                    className="h-8 w-8"
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
}
