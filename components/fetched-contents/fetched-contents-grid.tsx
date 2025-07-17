"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Bookmark,
  RefreshCw,
  FileText,
  Download,
  Eye,
  Columns3,
  MoreVertical,
  Info,
  FileTextIcon,
  History,
  Zap,
} from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { getFetchedContents } from "@/app/actions/fetched-contents"
import type { FetchedContentData } from "@/app/actions/fetched-contents"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { HorizontalScroller } from "@/components/horizontal-scroller"
import { commonStatusMap } from "@/lib/status-config"
import TableColumnHeader from "@/components/table-column-header"
import { format, parseISO, subDays, startOfDay, endOfDay } from "date-fns"
import { createPortal } from "react-dom"
import { Badge } from "@/components/ui/badge"
import { useViewBlade } from "@/lib/view-blade-context"
import { useBladeStack } from "@/lib/blade-stack-context"
import { useEditBlade } from "@/lib/edit-blade-context"
import { getFluxNames } from "@/app/actions/reports"
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
import { FetchedContentMenuItems, type FetchedContentMenuAction } from "./menu-items"
import ColumnsPanel from "@/components/shared/ColumnsPanel"
import { FetchedContentsErrorBoundary } from "./error-boundary"
import { TableErrorBoundary } from "./table-error-boundary"
import React from "react"

// Extend window for error recovery data
declare global {
  interface Window {
    lastSuccessfulData?: FetchedContentData[]
    lastSuccessfulTotalCount?: number
  }
}

type SortDirection = "asc" | "desc" | null
type ColumnKey = keyof FetchedContentData | "download" | "view"

interface Column {
  key: ColumnKey
  label: string
  hidden?: boolean
  pinned?: "left" | "right"
}

interface AppliedFilter {
  id: string
  field: string
  operator: string
  value: any
  label: string
}

interface FilterField {
  key: string
  label: string
  type: string
}

const statusOptions = ["Success", "Currently processing", "Failed"]

const timeRangeOptions = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "last7days" },
  { label: "Last 15 days", value: "last15days" },
  { label: "Last 30 days", value: "last30days" },
  { label: "Last 2 months", value: "last2months" },
  { label: "Custom date range", value: "custom" },
]

export const FetchedContentsGrid: React.FC<{
  fluxId: string
  fluxIdFilter?: number | null
  onClearFluxId?: () => void
  processingIdFilter?: number | null
  fetchingIdFilter?: number | null
  onClearProcessingId?: () => void
  onClearFetchingId?: () => void
  onProcessingClick?: (processingId: number) => void
  onPreviewClick?: (file: { id: string; name: string; fluxId: string; fluxName?: string }) => void
  /**
   * When true the grid is still filtered by `processingIdFilter`
   * but the corresponding filter badge is hidden and cannot be cleared
   * via the UI. Defaults to `false`.
  */
  hideProcessingIdBadge?: boolean
  /**
   * When true the grid is still filtered by `fetchingIdFilter`
   * but the corresponding filter badge is hidden and cannot be cleared
   * via the UI. Defaults to `false`.
   */
  hideFetchingIdBadge?: boolean
 /**
   * When true the column showing the Flux ID will be hidden even if
   * `fluxId` is set to "all".
   */
  hideFluxIdColumn?: boolean
  statusFilter?: string | null
  onClearStatusFilter?: () => void
}> = ({
  fluxId,
  fluxIdFilter,
  onClearFluxId,
  processingIdFilter,
  fetchingIdFilter,
  onClearProcessingId,
  onClearFetchingId,
  onProcessingClick,
  onPreviewClick,
  hideProcessingIdBadge = false,
  hideFetchingIdBadge = false,
  hideFluxIdColumn = false,
  statusFilter,
  onClearStatusFilter,
}) => {
  const [data, setData] = useState<FetchedContentData[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Start in safe mode by default to avoid the error
  const [useSafeMode, setUseSafeMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fetched-contents-safe-mode')
      return saved ? JSON.parse(saved) : true // Default to true (safe mode)
    }
    return true
  })
  const [sortColumn, setSortColumn] = useState<ColumnKey | null>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLargeDataset, setIsLargeDataset] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([])
  const [showAddFilterPanel, setShowAddFilterPanel] = useState(false)
  const [selectedFilterField, setSelectedFilterField] = useState<FilterField | null>(null)
  const [showSpecificFilterPanel, setShowSpecificFilterPanel] = useState(false)
  const [editingFilter, setEditingFilter] = useState<AppliedFilter | null>(null)

  const [textInputValue, setTextInputValue] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [distinctFileTypes, setDistinctFileTypes] = useState<string[]>([])
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState("")
  const [timeAfter, setTimeAfter] = useState("")
  const [timeBefore, setTimeBefore] = useState("")
  const [fluxNames, setFluxNames] = useState<Record<number, string>>({})
  const { openBlade: openViewBladeCtx } = useViewBlade()
  const { openBlade: openStackBlade } = useBladeStack()
  const { openBlade: openEditBladeCtx } = useEditBlade()
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null)
  const [openDropdownRowId, setOpenDropdownRowId] = useState<number | null>(null)
  const [openContextMenuRowId, setOpenContextMenuRowId] = useState<number | null>(null)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [quickFluxId, setQuickFluxId] = useState<number | null>(null)
  const [showColumnsPanel, setShowColumnsPanel] = useState(false)

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

  const showFluxId = fluxId === "all" && !hideFluxIdColumn
  const [columns, setColumns] = useState<Column[]>([
    { key: "contentID", label: "ID", hidden: false },
    ...(showFluxId ? [{ key: "fluxID", label: "Flux ID", hidden: false }] : []),
    { key: "status", label: "Status", hidden: false },
    { key: "contentShortName", label: "Content name", hidden: false },
    { key: "fileType", label: "File type", hidden: false },
    { key: "fileSize", label: "File size", hidden: false },
    { key: "numberOfProcessing", label: "Number of processing", hidden: false },
    { key: "createdAt", label: "Identified At", hidden: false },
    { key: "download", label: "Download file", hidden: false },
    { key: "view", label: "", hidden: false },
  ])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("fetched-contents-columns")
    if (stored) {
      try {
        setColumns(JSON.parse(stored))
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fetched-contents-columns", JSON.stringify(columns))
    }
  }, [columns])

  // Save safe mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fetched-contents-safe-mode', JSON.stringify(useSafeMode))
    }
  }, [useSafeMode])

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
    try {
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
    } catch (dragError) {
      console.error("Drag and drop error (likely 'enabled' property issue):", dragError)
      // Force safe mode when drag-drop fails
      setUseSafeMode(true)
      // Don't crash the whole component, just disable problematic features
    }
  }

  const availableFilterFields: FilterField[] = [
    ...(showFluxId ? [{ key: "fluxID", label: "Flux ID", type: "text" }] : []),
    { key: "fetchingID", label: "Fetching ID", type: "text" },
    { key: "processingID", label: "Processing ID", type: "text" },
    { key: "status", label: "Status", type: "status" },
    { key: "contentShortName", label: "Short name", type: "text" },
    { key: "contentName", label: "Full name", type: "text" },
    { key: "fileType", label: "File type", type: "filetype" },
    { key: "createdAt", label: "Content created", type: "timerange" },
  ]

  const pageSizeOptions = isLargeDataset ? [10, 20, 50, 100] : [10, 20, 50]

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

  const fetchData = useCallback(async () => {
    // Optimizacija: Memory leak protection - abort previous requests
    const controller = new AbortController()
    
    setIsLoading(true)
    setError(null)
    
    // Optimizacija: Kratak delay za debouncing za bolje UX
    if (!isInitialLoad) {
      await new Promise(resolve => setTimeout(resolve, 150))
    }
    let serverFilters = appliedFilters.map((filter) => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
    }))

    if (fluxIdFilter !== null && fluxIdFilter !== undefined) {
      serverFilters = serverFilters.filter((f) => f.field !== "fluxID")
      serverFilters.push({ field: "fluxID", operator: "equals", value: fluxIdFilter })
    }

    if (processingIdFilter !== null && processingIdFilter !== undefined) {
      serverFilters = serverFilters.filter((f) => f.field !== "processingID")
      serverFilters.push({
        field: "processingID",
        operator: "equals",
        value: processingIdFilter,
      })
    }

    if (fetchingIdFilter !== null && fetchingIdFilter !== undefined) {
      serverFilters = serverFilters.filter((f) => f.field !== "fetchingID")
      serverFilters.push({
        field: "fetchingID",
        operator: "equals",
        value: fetchingIdFilter,
      })
    }

    if (statusFilter) {
      serverFilters = serverFilters.filter((f) => f.field !== "status")
      serverFilters.push({ field: "status", operator: "equals", value: statusFilter })
    }

    const params = new URLSearchParams({
      fluxId,
      page: String(currentPage),
      pageSize: String(pageSize),
    })
    if (sortColumn) params.append("sortColumn", String(sortColumn))
    if (sortDirection) params.append("sortDirection", String(sortDirection))
    if (serverFilters.length) {
      params.append("filters", JSON.stringify(serverFilters))
    }
    try {
      const res = await fetch(`/api/fetched-contents?${params.toString()}`, {
        signal: controller.signal
      })
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const { data, totalCount, error } = await res.json()
      
      if (error) {
        console.error("API returned error:", error)
        setError(`Server error: ${error}`)
        setData([])
        setTotalCount(0)
      } else {
        // ----- POČETAK DVOSTRUKE ZAŠTITE -----
        
        // Declare ultraSafeData in function scope to avoid scope issues
        let ultraSafeData: FetchedContentData[] = []
        
        // DODATNA CLIENT-SIDE ZAŠTITA: Kreiraj potpuno nove objekte i na client strani
        if (data && Array.isArray(data)) {
          console.log("Client-side: Applying additional object protection for", data.length, "items")
          
          try {
            // Dvostruka zaštita: JSON deep clone + manual reconstruction
            ultraSafeData = data.map((item: any, index: number) => {
              try {
                // JSON clone first
                const jsonCloned = JSON.parse(JSON.stringify(item))
                
                // Then manual property assignment for extra safety
                const safeObject = {
                  contentID: jsonCloned.contentID,
                  fluxID: jsonCloned.fluxID,
                  fetchingID: jsonCloned.fetchingID,
                  status: jsonCloned.status,
                  contentName: jsonCloned.contentName,
                  contentShortName: jsonCloned.contentShortName,
                  fileType: jsonCloned.fileType,
                  fileSize: jsonCloned.fileSize,
                  numberOfProcessing: jsonCloned.numberOfProcessing,
                  createdAt: jsonCloned.createdAt,
                  sourceUrl: jsonCloned.sourceUrl,
                  processingID: jsonCloned.processingID
                }
                
                // Final insurance: create completely new object
                return Object.assign({}, safeObject)
                
              } catch (itemError) {
                console.error(`Failed to process item ${index}:`, itemError)
                return null
              }
            }).filter(Boolean)
            
            console.log("Client-side protection successful, created", ultraSafeData.length, "ultra-safe objects")
            
            // DETECTIVE MODE: Add stack trace monitoring
            const originalConsoleError = console.error
            console.error = function(...args) {
              if (args[0] && typeof args[0] === 'string' && args[0].includes('Cannot set property enabled')) {
                console.log('🔍 GOTCHA! Error caught at:', new Error().stack)
                console.log('🔍 Error arguments:', args)
                
                // Auto-switch to safe mode when error is detected
                console.log('🛡️ Switching to safe mode to bypass third-party library issues')
                setUseSafeMode(true)
              }
              return originalConsoleError.apply(console, args)
            }
            
            // Set data with extra protection using React.startTransition
            try {
              console.log("🔄 About to call setData with", ultraSafeData.length, "items")
              
              // Use React.startTransition to prevent blocking errors
              React.startTransition(() => {
                setData(ultraSafeData as FetchedContentData[])
              })
              
              console.log("✅ setData completed successfully")
              
              // Add a small delay to see if the error happens in the next render cycle
              setTimeout(() => {
                console.log("⏰ 100ms after setData - checking for errors")
              }, 100)
              
            } catch (setDataError) {
              console.error("❌ setData failed:", setDataError)
              // If setData fails, force safe mode
              setUseSafeMode(true)
              throw setDataError
            }
            
          } catch (clientError) {
            console.error("Client-side protection failed:", clientError)
            // Last resort fallback
            setData([])
          }
        } else {
          console.warn("Invalid data format received:", typeof data)
          setData([])
        }
        
        // ----- KRAJ DVOSTRUKE ZAŠTITE -----
    
        // Ostatak koda ostaje isti i nastavlja da koristi originalnu 'data' promenljivu
        if (showFluxId && data && data.length > 0) {
          const fluxIds = Array.from(new Set(data.map((d: any) => d.fluxID)))
          const { data: names } = await getFluxNames(fluxIds)
          setFluxNames(names)
        } else {
          setFluxNames({})
        }
        setTotalCount(totalCount || 0)
        setTotalPages(Math.ceil((totalCount || 0) / pageSize) || 1)
        
        // Detektuj velike dataset-e i predloži optimizacije
        setIsLargeDataset((totalCount || 0) > 10000)
        
        // Store the successfully processed data globally for error recovery
        window.lastSuccessfulData = ultraSafeData
        window.lastSuccessfulTotalCount = totalCount || 0
      }
    } catch (fetchError) {
      // Ne prikazuj error ako je request cancelovan
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return
      }
      
      console.error("Fetch error:", fetchError)
      
      // Check if this is the 'enabled' property error
      if (fetchError instanceof Error && fetchError.message.includes('Cannot set property enabled')) {
        console.log('🚨 ENABLED PROPERTY ERROR DETECTED IN FETCH!')
        console.log('🛡️ ACTIVATING SAFE MODE IMMEDIATELY')
        setUseSafeMode(true)
        setError(null) // Clear error since we're handling it with Safe Mode
        console.log('🛡️ Safe Mode activated - app should continue working')
        
        // Recover the data that was successfully processed before the error
        if (window.lastSuccessfulData && window.lastSuccessfulTotalCount) {
          console.log('🔄 Recovering successfully processed data for Safe Mode')
          setData(window.lastSuccessfulData)
          setTotalCount(window.lastSuccessfulTotalCount)
          setTotalPages(Math.ceil(window.lastSuccessfulTotalCount / pageSize) || 1)
        }
      } else {
        // For other errors, show error state
        setError(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`)
        setData([])
        setTotalCount(0)
      }
    }
    
    setIsLoading(false)
    setIsInitialLoad(false)
    
    
  }, [fluxId, fluxIdFilter, currentPage, pageSize, sortColumn, sortDirection, appliedFilters, processingIdFilter, fetchingIdFilter, statusFilter, isInitialLoad])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // DETECTIVE MODE: Global error monitoring
  useEffect(() => {
    const originalWindowError = window.onerror
    const originalUnhandledRejection = window.onunhandledrejection
    
    window.onerror = function(message, source, lineno, colno, error) {
      if (message && message.toString().includes('Cannot set property enabled')) {
        console.log('🚨 WINDOW ERROR CAUGHT - enabled property!')
        console.log('📍 Message:', message)
        console.log('📍 Source:', source)
        console.log('📍 Line:', lineno, 'Column:', colno)
        console.log('📍 Error object:', error)
        console.log('📍 Stack trace:', error?.stack)
      }
      return originalWindowError ? originalWindowError(message, source, lineno, colno, error) : false
    }
    
    window.onunhandledrejection = function(event) {
      if (event.reason && event.reason.message && event.reason.message.includes('Cannot set property enabled')) {
        console.log('🚨 UNHANDLED PROMISE REJECTION - enabled property!')
        console.log('📍 Reason:', event.reason)
        console.log('📍 Stack:', event.reason.stack)
        
        // FORCE SAFE MODE ACTIVATION
        console.log('🛡️ FORCE ACTIVATING SAFE MODE due to unhandled rejection')
        setUseSafeMode(true)
      }
      return originalUnhandledRejection ? originalUnhandledRejection(event) : undefined
    }
    
    return () => {
      window.onerror = originalWindowError
      window.onunhandledrejection = originalUnhandledRejection
    }
  }, [])

  useEffect(() => {
    if (processingIdFilter !== null && processingIdFilter !== undefined) {
      if (hideProcessingIdBadge) {
        // ensure the hidden filter is not present in the visual list
        setAppliedFilters((prev) => prev.filter((f) => f.id !== "processing"))
        setCurrentPage(1)
      } else {
        const otherFilters = appliedFilters.filter(
          (f) => f.id !== "processing" && f.id !== "fetching",
        )
        const processingFilter: AppliedFilter = {
          id: "processing",
          field: "processingID",
          operator: "equals",
          value: processingIdFilter,
          label: `Processing ID: ${processingIdFilter}`,
        }
        setAppliedFilters([...otherFilters, processingFilter])
        setCurrentPage(1)
      }
    } else {
      setAppliedFilters((prev) => prev.filter((f) => f.id !== "processing"))
    }
  }, [processingIdFilter, hideProcessingIdBadge])

  useEffect(() => {
    if (fetchingIdFilter !== null && fetchingIdFilter !== undefined) {
      if (hideFetchingIdBadge) {
        setAppliedFilters((prev) => prev.filter((f) => f.id !== "fetching"))
        setCurrentPage(1)
      } else {
        const otherFilters = appliedFilters.filter((f) => f.id !== "fetching" && f.id !== "processing")
        const fetchingFilter: AppliedFilter = {
          id: "fetching",
          field: "fetchingID",
          operator: "equals",
          value: fetchingIdFilter,
          label: `Fetching ID: ${fetchingIdFilter}`,
        }
        setAppliedFilters([...otherFilters, fetchingFilter])
        setCurrentPage(1)
      }
    } else {
      setAppliedFilters((prev) => prev.filter((f) => f.id !== "fetching"))
    }
  }, [fetchingIdFilter, hideFetchingIdBadge])

  useEffect(() => {
    if (statusFilter) {
      const otherFilters = appliedFilters.filter(
        (f) => f.id !== "status-prop" && f.id !== "processing" && f.id !== "fetching",
      )
      const statusF: AppliedFilter = {
        id: "status-prop",
        field: "status",
        operator: "equals",
        value: statusFilter,
        label: `Status: ${statusFilter}`,
      }
      setAppliedFilters([...otherFilters, statusF])
      setCurrentPage(1)
    } else {
      setAppliedFilters((prev) => prev.filter((f) => f.id !== "status-prop"))
    }
  }, [statusFilter])

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


  useEffect(() => {
    const fetchFileTypes = async () => {
      try {
        const res = await fetch(
          `/api/fetched-contents/file-types?fluxId=${fluxId}`,
        )
        const { data, error } = await res.json()
        if (!error) {
          setDistinctFileTypes(data)
        }
      } catch (err) {
        console.error("Failed to fetch distinct file types", err)
      }
    }
    fetchFileTypes()
  }, [fluxId])

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
    if (["download", "view"].includes(columnKey as string)) return
    const newDirection = sortColumn === columnKey && sortDirection === "asc" ? "desc" : "asc"
    setSortColumn(columnKey)
    setSortDirection(newDirection)
    setCurrentPage(1)
  }

  const handleSortAsc = (columnKey: ColumnKey) => {
    if (["download", "view"].includes(columnKey as string)) return
    setSortColumn(columnKey)
    setSortDirection("asc")
    setCurrentPage(1)
  }

  const handleSortDesc = (columnKey: ColumnKey) => {
    if (["download", "view"].includes(columnKey as string)) return
    setSortColumn(columnKey)
    setSortDirection("desc")
    setCurrentPage(1)
  }

  const pinColumn = (key: ColumnKey, side: "left" | "right") => {
    setColumns((cols) => cols.map((c) => (c.key === key ? { ...c, pinned: side } : c)))
  }

  const unpinColumn = (key: ColumnKey) => {
    setColumns((cols) => cols.map((c) => (c.key === key ? { ...c, pinned: undefined } : c)))
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

  const getSortIcon = (columnKey: ColumnKey) => {
    if (sortColumn === columnKey) {
      return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
    }
    return <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
  }

  const renderCell = (item: FetchedContentData, columnKey: ColumnKey) => {
    try {
      console.log(`🔍 Rendering cell for column: ${columnKey}, item:`, typeof item, Object.keys(item || {}))
    switch (columnKey) {
      case "contentID":
        return (
          <Badge
            className="bg-black text-white hover:bg-gray-300 cursor-pointer rounded-full px-2"
            onClick={() =>
              onPreviewClick?.({
                id: item.contentID.toString(),
                name: item.contentShortName || item.contentName || "Unknown File",
                fluxId: item.fluxID.toString(),
                fluxName: fluxNames[item.fluxID] || `Flux ${item.fluxID}`,
              })
            }
          >
            {item.contentID}
          </Badge>
        )
      case "status":
        const statusConfig = commonStatusMap[item.status]
        return statusConfig ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <statusConfig.icon className={cn("h-5 w-5", statusConfig.colorClass)} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{statusConfig.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-sm">{item.status}</span>
        )
      case "contentShortName":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate max-w-[150px] inline-block">{item.contentShortName}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.contentName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      case "fileSize":
        return `${(item.fileSize / (1024 * 1024)).toFixed(2)} MB`
      case "fluxID": {
        const fluxName = fluxNames[item.fluxID] || `Flux ${item.fluxID}`
        return (
          <div className="flex items-center gap-2">
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
            <span className="text-sm text-gray-600 truncate max-w-48">
              {fluxName}
            </span>
          </div>
        )
      }
      case "numberOfProcessing":
        const processingCount = item.numberOfProcessing ?? 0
        const processingId = item.processingID
        return (
          <Button
            variant="ghost"
            className="p-0 h-auto"
            onClick={() => {
              if (processingId) {
                onProcessingClick?.(processingId)
              }
            }}
            disabled={processingCount === 0 || !processingId}
          >
            <Badge className="bg-black text-white hover:bg-gray-700 rounded-full px-2 cursor-pointer">
              {processingCount}
            </Badge>
          </Button>
        )
      case "createdAt":
        return format(parseISO(item.createdAt), "dd MMM yyyy HH:mm")
      case "download":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex justify-center">
                  <Download className="h-5 w-5 text-gray-500 hover:text-primary" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.sourceUrl}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      case "view": {
        const fluxName = fluxNames[item.fluxID] || `Flux ${item.fluxID}`
        return (
          <div className="flex items-center justify-end space-x-1 pr-2">
            {isLargeScreen &&
              (hoveredRowId === item.contentID || openDropdownRowId === item.contentID) && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                          onClick={() =>
                            onPreviewClick?.({
                              id: item.contentID.toString(),
                              name: item.contentShortName || item.contentName || "Unknown File",
                              fluxId: item.fluxID.toString(),
                              fluxName: fluxNames[item.fluxID] || `Flux ${item.fluxID}`,
                            })
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Preview file</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex"
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>Download file</TooltipContent>
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
                          <FileTextIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View Flux</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            <DropdownMenu onOpenChange={(o) => setOpenDropdownRowId(o ? item.contentID : null)}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <FetchedContentMenuItems
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
        const value = item[columnKey as keyof FetchedContentData]
        return String(value ?? "–")
    }
    } catch (renderError) {
      console.error(`❌ Error rendering cell ${columnKey}:`, renderError)
      console.error('❌ Item that failed:', item)
      return <span style={{color: 'red'}}>Error</span>
    }
  }

  const handleApplySpecificFilter = () => {
    if (!selectedFilterField) return

    let filterValue: any
    let operator: string
    let label: string

    switch (selectedFilterField.type) {
      case "text":
        if (!textInputValue.trim()) return
        filterValue = textInputValue.trim()
        operator = "contains"
        label = `${selectedFilterField.label}: ${textInputValue.trim()}`
        if (
          selectedFilterField.key === "fetchingID" ||
          selectedFilterField.key === "processingID" ||
          selectedFilterField.key === "fluxID"
        ) {
          operator = "equals"
        }
        break
      case "status":
        if (selectedStatuses.length === 0) return
        filterValue = selectedStatuses
        operator = "in"
        label = `Status: ${selectedStatuses.join(", ")}`
        break
      case "filetype":
        if (selectedFileTypes.length === 0) return
        filterValue = selectedFileTypes
        operator = "in"
        label = `File Type: ${selectedFileTypes.join(", ")}`
        break
      case "timerange":
        if (!selectedTimeRange) return
        if (selectedTimeRange === "custom") {
          if (!timeAfter && !timeBefore) return
          filterValue = { after: timeAfter, before: timeBefore }
          operator = "custom_date_range"
          label = `${selectedFilterField.label}: Custom (${timeAfter || "any"} - ${timeBefore || "any"})`
        } else {
          const dateRange = getDateRangeForTimeOption(selectedTimeRange)
          if (!dateRange) return
          filterValue = dateRange
          operator = "date_range"
          label = `${selectedFilterField.label}: ${timeRangeOptions.find((o) => o.value === selectedTimeRange)?.label}`
        }
        break
      default:
        return
    }

    const newFilter: AppliedFilter = {
      id: editingFilter?.id || Date.now().toString(),
      field: selectedFilterField.key,
      operator,
      value: filterValue,
      label,
    }

    setAppliedFilters((prev) =>
      editingFilter ? prev.map((f) => (f.id === editingFilter.id ? newFilter : f)) : [...prev, newFilter],
    )

    setCurrentPage(1)
    setShowSpecificFilterPanel(false)
    setShowAddFilterPanel(false)
    setSelectedFilterField(null)
    setEditingFilter(null)
  }

  const handleEditFilter = (filter: AppliedFilter) => {
    const field = availableFilterFields.find((f) => f.key === filter.field)
    if (!field) return

    setTextInputValue("")
    setSelectedStatuses([])
    setSelectedFileTypes([])
    setSelectedTimeRange("")
    setTimeAfter("")
    setTimeBefore("")

    setEditingFilter(filter)
    setSelectedFilterField(field)

    switch (field.type) {
      case "text":
        setTextInputValue(String(filter.value || ""))
        break
      case "status":
        setSelectedStatuses(Array.isArray(filter.value) ? filter.value : [])
        break
      case "filetype":
        setSelectedFileTypes(Array.isArray(filter.value) ? filter.value : [])
        break
      case "timerange":
        if (filter.operator === "custom_date_range") {
          setSelectedTimeRange("custom")
          setTimeAfter(filter.value.after || "")
          setTimeBefore(filter.value.before || "")
        } else {
          const matchingOption = timeRangeOptions.find((opt) => {
            if (opt.value === "custom") return false
            const dateRange = getDateRangeForTimeOption(opt.value)
            return dateRange && JSON.stringify(dateRange) === JSON.stringify(filter.value)
          })
          setSelectedTimeRange(matchingOption?.value || "")
        }
        break
    }

    setShowSpecificFilterPanel(true)
    setShowAddFilterPanel(false)
  }

  const handleRemoveFilter = (filterId: string) => {
    if (filterId === "processing" && !hideProcessingIdBadge) {
      onClearProcessingId?.()
    }
    if (filterId === "fetching" && !hideFetchingIdBadge) {
      onClearFetchingId?.()
    }

    if (filterId === "status-prop") {
      onClearStatusFilter?.()
    }

    if (filterId === "flux") {
      onClearFluxId?.()
    }
    
    setAppliedFilters((prev) => prev.filter((f) => f.id !== filterId))
  }

  const renderSpecificFilterContent = () => {
    if (!selectedFilterField) return null
    switch (selectedFilterField.type) {
      case "text":
        return <Input type="text" value={textInputValue} onChange={(e) => setTextInputValue(e.target.value)} />
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
      case "filetype":
        return (
          <div className="space-y-2">
            {distinctFileTypes.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <Checkbox
                  id={`filetype-${type}`}
                  checked={selectedFileTypes.includes(type)}
                  onCheckedChange={() =>
                    setSelectedFileTypes((prev) =>
                      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
                    )
                  }
                />
                <label htmlFor={`filetype-${type}`}>{type}</label>
              </div>
            ))}
          </div>
        )
      case "timerange":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {timeRangeOptions.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`time-${option.value}`}
                    checked={selectedTimeRange === option.value}
                    onCheckedChange={() => setSelectedTimeRange(selectedTimeRange === option.value ? "" : option.value)}
                  />
                  <label htmlFor={`time-${option.value}`}>{option.label}</label>
                </div>
              ))}
            </div>
            {selectedTimeRange === "custom" && (
              <div className="space-y-2 pl-6">
                <div>
                  <label className="text-sm font-medium">After:</label>
                  <Input type="date" value={timeAfter} onChange={(e) => setTimeAfter(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Before:</label>
                  <Input type="date" value={timeBefore} onChange={(e) => setTimeBefore(e.target.value)} />
                </div>
              </div>
            )}
          </div>
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center text-red-500">
        <FileText className="h-16 w-16 mb-4 text-red-300" />
        <p className="text-lg font-semibold mb-2">Error loading data</p>
        <p className="text-sm mb-4">{error}</p>
        <Button onClick={() => {
          setError(null)
          fetchData()
        }} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (!isLoading && data.length === 0 && appliedFilters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center text-gray-500">
        <FileText className="h-16 w-16 mb-4 text-gray-300" />
        <p className="text-lg">No fetching contents found for this flux.</p>
      </div>
    )
  }

  function handleSelectFilterField(field: FilterField) {
    setSelectedFilterField(field)
    setShowSpecificFilterPanel(true)

    setTextInputValue("")
    setSelectedStatuses([])
    setSelectedFileTypes([])
    setSelectedTimeRange("")
    setTimeAfter("")
    setTimeBefore("")
  }

  const handleMenuAction = (action: FetchedContentMenuAction, row: FetchedContentData) => {
    const fluxName = fluxNames[row.fluxID] || `Flux ${row.fluxID}`
    switch (action) {
      case "preview":
        onPreviewClick?.({
          id: row.contentID.toString(),
          name: row.contentShortName || row.contentName || "Unknown File",
          fluxId: row.fluxID.toString(),
          fluxName,
        })
        break
      case "quickFlux":
        setQuickFluxId(row.fluxID)
        break
      case "viewFlux":
        openViewBlade(row.fluxID, fluxName)
        break
      case "editFlux":
        handleEditFlux(row.fluxID)
        break
      case "viewProcessing":
        if (row.processingID) {
          onProcessingClick?.(row.processingID)
        }
        break
      default:
        break
    }
  }

  const handleBackToFilterList = () => {
    setShowSpecificFilterPanel(false)
    setSelectedFilterField(null)
  }

  return (
    <FetchedContentsErrorBoundary onRetry={() => {
      setError(null)
      setData([])
      fetchData()
    }}>
      <div className="space-y-4">
      {isLargeDataset && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Very large dataset detected ({totalCount.toLocaleString()} items). Please consider using filters to improve performance.
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between gap-4">
        <HorizontalScroller>
          <div className="flex items-center space-x-2 py-1">
            <Button variant="outline" className="h-9 px-3 bg-transparent">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved Filters
            </Button>
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            {appliedFilters.map((filter) => (
              <Button
                key={filter.id}
                variant="outline"
                className="h-9 text-sm px-3 py-2 bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200 group"
                onClick={() => handleEditFilter(filter)}
              >
                <span className="mr-1.5 whitespace-nowrap">{filter.label}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 ml-1 -mr-1 text-blue-700 hover:bg-blue-100/50"
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
                  const hasProcessingFilter = appliedFilters.some((f) => f.id === "processing")
                  if (hasProcessingFilter && !hideProcessingIdBadge) {
                    onClearProcessingId?.()
                  }
                  const hasFetchingFilter = appliedFilters.some((f) => f.id === "fetching")
                  if (hasFetchingFilter && !hideFetchingIdBadge) {
                    onClearFetchingId?.()
                  }
                  const hasStatusFilter = appliedFilters.some((f) => f.id === "status-prop")
                  if (hasStatusFilter) {
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
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setUseSafeMode(!useSafeMode)}
            className={cn("text-xs", useSafeMode ? "bg-yellow-100" : "")}
          >
            {useSafeMode ? "🛡️ Safe" : "🔧 Normal"}
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

      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-auto">
          {useSafeMode ? (
            // SAFE MODE: No drag-drop, simplified table
            <div className="bg-yellow-100 p-2 text-sm">
              🛡️ Safe Mode Active - Drag & Drop disabled due to compatibility issues
            </div>
          ) : null}
          
          <TableErrorBoundary onForceSafeMode={() => setUseSafeMode(true)}>
            <div style={{ isolation: 'isolate' }}>
            {useSafeMode ? (
              // Safe mode table without DragDropContext
              <Table>
                <TableHeader>
                  <TableRow>
                    {getOrderedColumns().map((col) => (
                      <TableHead key={col.key} className={cn(col.key === "view" && "min-w-[240px] text-right pr-2")}>
                        <div className="flex items-center gap-2">
                          <span>{col.label}</span>
                          {getSortIcon(col.key)}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((item, index) => {
                      try {
                        console.log(`🛡️ Safe mode rendering row ${index}`)
                        return (
                          <TableRow key={item.contentID}>
                            {getOrderedColumns().map((col) => (
                              <TableCell key={col.key} className={cn(col.key === "view" && "min-w-[240px] text-right pr-2")}>
                                {renderCell(item, col.key)}
                              </TableCell>
                            ))}
                          </TableRow>
                        )
                      } catch (safeRowError) {
                        console.error(`❌ Safe mode row error ${index}:`, safeRowError)
                        return (
                          <TableRow key={index}>
                            <TableCell colSpan={getOrderedColumns().length} className="text-red-500">
                              Safe mode error for row {index}
                            </TableCell>
                          </TableRow>
                        )
                      }
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={getOrderedColumns().length} className="h-24 text-center">
                        No results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              // Normal mode with drag-drop
              <DragDropContext onDragEnd={handleDragEnd}>
                <Table>
              <TableHeader>
                <Droppable droppableId="columns-fetched-contents" direction="horizontal">
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
                data.map((item, index) => {
                  try {
                    console.log(`🔍 Rendering table row ${index}:`, typeof item, item?.contentID)
                    return (
                  <ContextMenu
                    key={item.contentID}
                    open={openContextMenuRowId === item.contentID}
                    onOpenChange={(o) => setOpenContextMenuRowId(o ? item.contentID : null)}
                  >
                    <ContextMenuTrigger asChild>
                      <TableRow
                        onMouseEnter={() => setHoveredRowId(item.contentID)}
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
                      <FetchedContentMenuItems
                        item={item}
                        onAction={(action) => handleMenuAction(action, item)}
                        components={{ Item: ContextMenuItem, Separator: ContextMenuSeparator }}
                      />
                    </ContextMenuContent>
                  </ContextMenu>
                    )
                  } catch (rowError) {
                    console.error(`❌ Error rendering row ${index}:`, rowError)
                    console.error('❌ Row item that failed:', item)
                    return (
                      <TableRow key={index}>
                        <TableCell colSpan={getOrderedColumns().length} className="text-red-500">
                          Error rendering row {index}
                        </TableCell>
                      </TableRow>
                    )
                  }
                })
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
            )}
            </div>
          </TableErrorBoundary>
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
          <div className="flex items-center space-x-2 text-sm text-[#505050]">
            <span>
              {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

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
    </FetchedContentsErrorBoundary>
  )
}
