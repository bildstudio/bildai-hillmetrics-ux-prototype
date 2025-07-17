"use client"

import type React from "react"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
  Columns3,
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
} from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { cn } from "@/lib/utils"
import { useSearch } from "@/lib/search-context"
import { dataStore, type FluxData } from "@/lib/data-store"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { BladePanelData } from "@/components/blade/blade-panel"
import { useTestNotification, type NotificationAction } from "@/lib/test-notification-context"
import { useBlade } from "@/lib/blade-context"
import { useViewBlade } from "@/lib/view-blade-context"
import { useBladeStack } from "@/lib/blade-stack-context"
import { HorizontalScroller } from "@/components/horizontal-scroller"
import { commonStatusMap } from "@/lib/status-config" // Import common status map
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu" // Import ContextMenu components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu" // Import DropdownMenu components
import { FluxMenuItems, type FluxMenuAction } from "@/components/flux-list/menu-items"
import TableColumnHeader from "@/components/table-column-header"
import ColumnsPanel from "@/components/shared/ColumnsPanel"

type SortDirection = "asc" | "desc" | null
type ColumnKey =
  | "id"
  | "name"
  | "financialType"
  | "fluxType"
  | "category"
  | "lastFetchingDate"
  | "stage"
  | "fetchingErrorCount"
  | "lastProcessingDate"
  | "actions" // New actions column

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

interface FluxListPageProps {
  isSidebarCollapsed?: boolean
}

const fluxTypeIcons = {
  API: Database,
  https: Globe,
  SFTP: HardDrive,
  Mail: Mail,
  File: FileText,
  Webhook: Webhook,
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

const categoryOptions = ["Active", "Disabled", "Back office only", "Obsolete"]
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

export default function FluxListPage({ isSidebarCollapsed }: FluxListPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openBlade } = useBlade()
  const { openBlade: openViewBladeCtx } = useViewBlade()
  const { openBlade: openStackBlade } = useBladeStack()
  const { searchTerm, setSearchTerm } = useSearch()

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

  const [sortColumn, setSortColumn] = useState<ColumnKey | null>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
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
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null) // New state for row hover
  const [isLargeScreen, setIsLargeScreen] = useState(false) // New state for large screen detection
  const [openDropdownRowId, setOpenDropdownRowId] = useState<string | null>(null) // New state to track open dropdown
  const [openContextMenuRowId, setOpenContextMenuRowId] = useState<string | null>(null)
  const [showColumnsPanel, setShowColumnsPanel] = useState(false)

  const savedFiltersInputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const numberInputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const [columns, setColumns] = useState<Column[]>([
    { key: "id", label: "ID", sortable: true, draggable: false, hidden: false },
    { key: "name", label: "Name", sortable: true, draggable: true, hidden: false },
    { key: "financialType", label: "Financial type", sortable: true, draggable: true, hidden: false },
    { key: "fluxType", label: "Flux type", sortable: true, draggable: true, hidden: false },
    { key: "category", label: "Status", sortable: true, draggable: true, hidden: false },
    { key: "lastFetchingDate", label: "Last Fetching", sortable: true, draggable: true, hidden: false },
    { key: "stage", label: "Fetching status", sortable: true, draggable: true, hidden: false },
    { key: "fetchingErrorCount", label: "Fetch Errors", sortable: true, draggable: true, hidden: false },
    { key: "lastProcessingDate", label: "Last processing", sortable: true, draggable: true, hidden: false },
    { key: "actions", label: "", sortable: false, draggable: false, hidden: false }, // New Actions column
  ])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("flux-list-columns")
    if (stored) {
      try {
        const parsed: Column[] = JSON.parse(stored)
        setColumns(parsed)
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("flux-list-columns", JSON.stringify(columns))
    }
  }, [columns])

  const availableFilterFields: FilterField[] = [
    { key: "id", label: "ID", type: "number" },
    { key: "name", label: "Name", type: "text" },
    // Removed the old 'stage' filter and replaced it with 'category' labeled as 'Flux state'
    { key: "category", label: "Flux state", type: "select" },
    { key: "financialType", label: "Financial Type", type: "select" },
    { key: "fluxType", label: "Flux Type", type: "select" },
    { key: "lastFetchingDate", label: "Last Fetching Date", type: "text" },
    { key: "fetchingErrorCount", label: "Fetching Error Count", type: "number" },
    { key: "lastProcessingDate", label: "Last Processing Date", type: "text" },
  ]

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

  const currentData = useMemo(() => dataStore.getAllFlux(), [isDataLoaded])
  const isFilterFieldApplied = useCallback(
    (fieldKey: string) => appliedFilters.some((filter) => filter.field === fieldKey),
    [appliedFilters],
  )

  const applyFiltersToData = useCallback((data: FluxData[], filtersToApply: AppliedFilter[]) => {
    return data.filter((item) => {
      return filtersToApply.every((filter) => {
        const fieldValue = item[filter.field as keyof FluxData]
        switch (filter.operator) {
          case "contains":
            return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase())
          case "startsWith":
            return String(fieldValue).toLowerCase().startsWith(String(filter.value).toLowerCase())
          case "exactMatch":
            return String(fieldValue).toLowerCase() === String(filter.value).toLowerCase()
          case "endsWith":
            return String(fieldValue).toLowerCase().endsWith(String(filter.value).toLowerCase())
          case "equals":
            return typeof fieldValue === "number"
              ? fieldValue === Number(filter.value)
              : String(fieldValue) === String(filter.value)
          case "greaterThan":
            return Number(fieldValue) > Number(filter.value)
          case "lessThan":
            return Number(fieldValue) < Number(filter.value)
          case "greaterThanOrEqual":
            return Number(fieldValue) >= Number(filter.value)
          case "lessThanOrEqual":
            return Number(fieldValue) <= Number(filter.value)
          case "notEquals":
            return Number(fieldValue) !== Number(filter.value)
          case "in":
            return Array.isArray(filter.value) && filter.value.includes(String(fieldValue))
          default:
            return true
        }
      })
    })
  }, [])

  const filteredAndSortedData = useMemo(() => {
    let filtered = currentData
    if (searchTerm.trim()) {
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (appliedFilters.length > 0) {
      filtered = applyFiltersToData(filtered, appliedFilters)
    }
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortColumn]
        let bVal = b[sortColumn]
        if (sortColumn === "fetchingErrorCount" || sortColumn === "id") {
          aVal = Number(aVal)
          bVal = Number(bVal)
        }
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }
    return filtered
  }, [currentData, searchTerm, sortColumn, sortDirection, appliedFilters, applyFiltersToData])

  const loadSavedFilters = async () => {
    try {
      const response = await fetch("/data/saved-filters.json")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const filters = await response.json()
      setSavedFilters(filters)
    } catch (error) {
      console.error("Error loading saved filters:", error)
      setSavedFilters([])
    }
  }

  const saveSavedFilters = async (filtersToSave: SavedFilter[]) => {
    try {
      console.log("Saving filters to server (simulated):", filtersToSave)
      setSavedFilters(filtersToSave)
    } catch (error) {
      console.error("Error saving filters:", error)
    }
  }

  const handleSaveFilter = async () => {
    if (filterNameInput.trim()) {
      const newFilter: SavedFilter = {
        id: Date.now().toString(),
        name: filterNameInput.trim(),
        filters: appliedFilters,
        createdAt: new Date().toISOString(),
      }
      const updatedFilters = [...savedFilters, newFilter]
      await saveSavedFilters(updatedFilters)
      setFilterNameInput("")
    }
  }

  const handleDeleteFilter = async (filterId: string) => {
    const updatedFilters = savedFilters.filter((f) => f.id !== filterId)
    await saveSavedFilters(updatedFilters)
  }

  const handleApplySavedFilter = async (filter: SavedFilter) => {
    setShowLoadingTooltip(true)
    setShowSavedFiltersPanel(false)
    try {
      setAppliedFilters(filter.filters || [])
      await new Promise((resolve) => setTimeout(resolve, 300))
      setCurrentPage(1)
      updateUrlWithPagination(1, pageSize)
    } catch (error) {
      console.error("Error applying filter:", error)
    } finally {
      setShowLoadingTooltip(false)
    }
  }

  const currentProcessTimer = useRef<NodeJS.Timeout | null>(null)
  const { hideCustomNotification, updateCustomNotification, showCustomNotification } = useTestNotification()
  const { setBladeInitialData, setIsBladeOpen, dataFromLastSaveAttempt, setDataFromLastSaveAttempt } = useBlade()

  const clearCurrentProcessTimer = () => {
    if (currentProcessTimer.current) {
      clearTimeout(currentProcessTimer.current)
      currentProcessTimer.current = null
    }
  }

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const runFluxSaveNotificationSequence = async (savedData: BladePanelData) => {
    clearCurrentProcessTimer()
    const cancelSaveAction: NotificationAction = {
      label: "Cancel",
      variant: "outline",
      onClick: () => {
        clearCurrentProcessTimer()
        hideCustomNotification()
        setBladeInitialData(dataFromLastSaveAttempt)
        setIsBladeOpen(true)
        console.log("Save cancelled, blade reopened.")
      },
    }
    const closeSavingAction: NotificationAction = {
      label: "Close",
      variant: "ghost",
      onClick: () => {
        clearCurrentProcessTimer()
        hideCustomNotification()
        console.log("Saving process closed by user. Flux considered saved (simulated).")
      },
    }
    showCustomNotification("Saving flux...", [cancelSaveAction, closeSavingAction], true)
    try {
      await delay(3000)
      const undoAction: NotificationAction = {
        label: "Undo",
        variant: "destructive",
        onClick: async () => {
          clearCurrentProcessTimer()
          updateCustomNotification("Undoing save...", [], true)
          await delay(1500)
          hideCustomNotification()
          setBladeInitialData(dataFromLastSaveAttempt)
          setIsBladeOpen(true)
          console.log("Undo successful, flux deleted (simulated), blade reopened.")
        },
      }
      const viewAction: NotificationAction = {
        label: "View",
        onClick: () => console.log("View clicked (placeholder)"),
        variant: "link",
      }
      const closeUndoStageAction: NotificationAction = {
        label: "Close",
        variant: "ghost",
        onClick: () => {
          clearCurrentProcessTimer()
          hideCustomNotification()
          console.log("Flux saved, undo window closed by user.")
        },
      }
      updateCustomNotification("Flux successfully saved.", [undoAction, viewAction, closeUndoStageAction], false)
      currentProcessTimer.current = setTimeout(async () => {
        const closePermanentStageAction: NotificationAction = {
          label: "Close",
          variant: "ghost",
          onClick: () => {
            clearCurrentProcessTimer()
            hideCustomNotification()
          },
        }
        updateCustomNotification("Flux successfully saved.", [viewAction, closePermanentStageAction], false)
        currentProcessTimer.current = setTimeout(() => {
          hideCustomNotification()
        }, 7000)
      }, 10000)
    } catch (error) {
      console.error("Error during save sequence (timeout related):", error)
    }
  }

  const handleSaveFromBlade = (data: BladePanelData) => {
    console.log("Data received from blade:", data)
    setDataFromLastSaveAttempt(data)
    setIsBladeOpen(false)
    runFluxSaveNotificationSequence(data)
  }

  useEffect(() => {
    if (showSavedFiltersPanel) {
      setTimeout(() => {
        savedFiltersInputRef.current?.focus()
      }, 100)
    }
  }, [showSavedFiltersPanel])
  useEffect(() => {
    if (showSpecificFilterPanel && selectedFilterField) {
      setTimeout(() => {
        switch (selectedFilterField.type) {
          case "text":
            textInputRef.current?.focus()
            break
          case "number":
            numberInputRef.current?.focus()
            break
          case "date":
            dateInputRef.current?.focus()
            break
        }
      }, 100)
    }
  }, [showSpecificFilterPanel, selectedFilterField])

  const handleSelectFilterField = (field: FilterField, existingFilter?: AppliedFilter) => {
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

  const handleBackToFilterList = () => {
    setShowSpecificFilterPanel(false)
    setSelectedFilterField(null)
  }

  const handleApplySpecificFilter = async () => {
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
          filterValue = numberFilterValue
          operator = numberFilterOperator
          label = `${selectedFilterField.label} ${numberFilterOperator} ${numberFilterValue}`
          break
        case "select":
          if (selectedOptions.length === 0) return
          filterValue = selectedOptions
          operator = "in"
          label = `${selectedOptions.length === 1 ? selectedOptions[0] : selectedFilterField.label + " in [" + selectedOptions.join(", ") + "]"}`
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
      await new Promise((resolve) => setTimeout(resolve, 300))
      setCurrentPage(1)
      updateUrlWithPagination(1, pageSize)
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

  const handleEditFilter = (filter: AppliedFilter) => {
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

  const getSelectOptions = (fieldKey: string) => {
    switch (fieldKey) {
      case "stage": // This case is still here for the 'stage' column rendering, but the filter field is removed.
        return stageOptions
      case "category": // This now handles the "Flux state" filter
        return categoryOptions
      case "financialType":
        return financialTypeOptions
      case "fluxType":
        return fluxTypeOptions
      default:
        return []
    }
  }

  const handleOptionToggle = (option: string) => {
    setSelectedOptions((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]))
  }
  const handleSavedFiltersKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filterNameInput.trim()) {
      e.preventDefault()
      e.stopPropagation()
      handleSaveFilter()
    }
  }
  const handleSpecificFilterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation()
      handleApplySpecificFilter()
    }
  }

  const renderSpecificFilterContent = () => {
    if (!selectedFilterField) return null
    switch (selectedFilterField.type) {
      case "text":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Type</label>
              <Select value={textFilterOperator} onValueChange={setTextFilterOperator}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="startsWith">Starts with</SelectItem>
                  <SelectItem value="exactMatch">Exact match</SelectItem>
                  <SelectItem value="endsWith">Ends with</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
              <Input
                ref={textInputRef}
                placeholder={`Enter ${selectedFilterField.label.toLowerCase()}...`}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Operator</label>
              <Select value={numberFilterOperator} onValueChange={setNumberFilterOperator}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="greaterThan">Greater than</SelectItem>
                  <SelectItem value="lessThan">Less than</SelectItem>
                  <SelectItem value="greaterThanOrEqual">Greater than or equal</SelectItem>
                  <SelectItem value="lessThanOrEqual">Less than</SelectItem>
                  <SelectItem value="notEquals">Not equals</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
              <Input
                ref={numberInputRef}
                type="number"
                placeholder={`Enter ${selectedFilterField.label.toLowerCase()}...`}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Options</label>
              <div className="space-y-2 overflow-y-auto">
                {options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={selectedOptions.includes(option)}
                      onCheckedChange={() => handleOptionToggle(option)}
                    />
                    <label htmlFor={option} className="text-sm text-gray-700 cursor-pointer">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Operator</label>
              <Select value={dateFilterOperator} onValueChange={setDateFilterOperator}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="equals">On date</SelectItem>
                  <SelectItem value="before">Before</SelectItem>
                  <SelectItem value="after">After</SelectItem>
                  <SelectItem value="between">Between</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <Input
                ref={dateInputRef}
                type="date"
                value={dateFilterValue}
                onChange={(e) => setDateFilterValue(e.target.value)}
                onKeyDown={handleSpecificFilterKeyDown}
              />
            </div>
          </div>
        )
      default:
        return <div>Filter type not supported yet</div>
    }
  }

  const updateUrlWithPagination = useCallback(
    (page: number, size: number, col: ColumnKey | null = sortColumn, dir: SortDirection = sortDirection) => {
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
      if (searchTerm) params.set("q", searchTerm)

      const queryString = params.toString()
      const newUrl = queryString ? `/flux-list?${queryString}` : "/flux-list"
      router.replace(newUrl, { scroll: false })
    },
    [router, searchParams, searchTerm, sortColumn, sortDirection],
  )

  useEffect(() => {
    const checkDataLoad = async () => {
      await dataStore.waitForLoad()
      setIsDataLoaded(true)
    }
    checkDataLoad()
  }, [])
  useEffect(() => {
    loadSavedFilters()
  }, [])
  useEffect(() => {
    const urlPage = searchParams.get("page")
    const pageNum = urlPage ? Number.parseInt(urlPage, 10) : 1
    if (pageNum !== currentPage) {
      setCurrentPage(pageNum > 0 ? pageNum : 1)
    }

    const urlPageSize = searchParams.get("pageSize")
    const sizeNum = urlPageSize ? Number.parseInt(urlPageSize, 10) : 10
    if (sizeNum !== pageSize) {
      setPageSize(sizeNum > 0 ? sizeNum : 10)
    }
  }, [searchParams, setCurrentPage, setPageSize, currentPage, pageSize])

  useEffect(() => {
    const newTotalPages = Math.ceil(filteredAndSortedData.length / pageSize) || 1
    setTotalPages(newTotalPages)
    if (currentPage > newTotalPages && filteredAndSortedData.length > 0) {
      setCurrentPage(1)
      updateUrlWithPagination(1, pageSize)
    } else if (filteredAndSortedData.length === 0 && currentPage !== 1) {
      setCurrentPage(1)
      updateUrlWithPagination(1, pageSize)
    }
  }, [filteredAndSortedData, pageSize, currentPage, updateUrlWithPagination])

  const paginatedData = filteredAndSortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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

  const openFilterForColumn = (key: ColumnKey) => {
    const field = availableFilterFields.find((f) => f.key === key)
    if (!field) return
    const existing = appliedFilters.find((f) => f.field === key)
    handleSelectFilterField(field, existing)
    setShowAddFilterPanel(false)
  }

  const hideColumn = (key: ColumnKey) => {
    setColumns((cols) => cols.map((c) => (c.key === key ? { ...c, hidden: true } : c)))
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
      updateUrlWithPagination(page, pageSize)
    }
  }
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      updateUrlWithPagination(newPage, pageSize)
    }
  }
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      updateUrlWithPagination(newPage, pageSize)
    }
  }

  const handleRefresh = useCallback(() => {
    setShowLoadingTooltip(true)
    dataStore.resetData()
    setAppliedFilters([])
    setSearchTerm("")
    setCurrentPage(1)
    setPageSize(10)
    updateUrlWithPagination(1, 10)
    dataStore.waitForLoad().then(() => {
      setIsDataLoaded(true)
      loadSavedFilters()
      setShowLoadingTooltip(false)
    })
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

  const handleMenuAction = (action: FluxMenuAction, row: FluxData) => {
    switch (action) {
      case "view":
        console.log("View clicked for item:", row.id)
        break
      case "edit":
        console.log("Edit clicked for item:", row.id)
        break
      case "rename":
        setOpenContextMenuRowId(null)
        console.log("Rename clicked for item:", row.id)
        break
      case "makeCopy":
        console.log("Make a copy clicked for item:", row.id)
        break
      case "fetch":
        console.log("Fetch clicked for item:", row.id)
        break
      case "forceProcess":
        console.log("Force Process all fetching clicked for item:", row.id)
        break
      case "viewFetchingHistory":
        console.log("View fetching history clicked for item:", row.id)
        break
      case "viewProcessingHistory":
        console.log("View processing history clicked for item:", row.id)
        break
      case "viewErrorLogs":
        console.log("View error logs clicked for item:", row.id)
        break
      case "viewFinancialData":
        console.log("View financial data points clicked for item:", row.id)
        break
      case "viewWorkflowDetails":
        console.log("View workflow details clicked for item:", row.id)
        break
      case "remove":
        console.log("Remove clicked for item:", row.id)
        break
      default:
        break
    }
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
      case "id":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className="bg-black text-white hover:bg-gray-300 cursor-pointer rounded-full px-2"
                  onClick={() => openViewBlade(String(item.id), item.name)}
                >
                  {item.id}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
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
      case "category": // This is the "Status" column in Flux List
        const categoryConfig = commonStatusMap[item.category]
        if (categoryConfig) {
          const IconComponent = categoryConfig.icon
          return (
            <div className="flex items-center justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconComponent className={cn("h-5 w-5", categoryConfig.colorClass)} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{categoryConfig.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        }
        return <span>{item.category}</span> // Fallback if category not found in map
      case "stage": // This is the "Fetching status" column
        const stageConfig = commonStatusMap[item.stage]
        if (stageConfig) {
          const IconComponent = stageConfig.icon
          return (
            <div className="flex items-center justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconComponent className={cn("h-5 w-5", stageConfig.colorClass)} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{stageConfig.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        }
        return <span>{item.stage}</span> // Fallback if stage not found in map
      case "fetchingErrorCount":
        return (
          <span className={cn("font-medium", item.fetchingErrorCount > 0 ? "text-red-600" : "text-gray-600")}>
            {item.fetchingErrorCount}
          </span>
        )
      case "name":
      case "financialType":
      case "lastFetchingDate":
      case "lastProcessingDate":
        return isMobileView ? renderTruncatedText(String(cellContent)) : <span>{String(cellContent)}</span>
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
                <FluxMenuItems
                  item={item}
                  onAction={(action) => handleMenuAction(action, item)}
                  components={{ Item: DropdownMenuItem, Separator: DropdownMenuSeparator }}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      default:
        return <span>{String(cellContent)}</span>
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

      {/* Saved Filters Slide Panel */}
      {showSavedFiltersPanel && (
        <>
          <div
            className={cn(
              "fixed inset-0 bg-black transition-opacity duration-600 z-[9998]",
              showSavedFiltersPanel ? "bg-opacity-50" : "bg-opacity-0",
            )}
            onClick={() => setShowSavedFiltersPanel(false)}
          />
          <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300 z-[9999]">
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
                onKeyDown={handleSavedFiltersKeyDown}
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
                      onClick={() => handleApplySavedFilter(filter)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-[#040404]">{filter.name}</p>
                        <p className="text-xs text-gray-500">{new Date(filter.createdAt).toLocaleDateString()}</p>
                      </div>
                      {hoveredFilterId === filter.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFilter(filter.id)
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
        </>
      )}

      {/* Add/Edit Filter Panels */}
      {(showAddFilterPanel || (showSpecificFilterPanel && editingFilter)) && (
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
          {/* Add Filter List Panel (only when adding new, not editing) */}
          {showAddFilterPanel && !editingFilter && (
            <div
              className={cn(
                "fixed top-0 h-full w-96 bg-white shadow-xl flex flex-col transition-all duration-300 z-[9999]",
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
          {/* Overlay for Add Filter List Panel when specific panel is open */}
          {showAddFilterPanel && !editingFilter && showSpecificFilterPanel && (
            <div
              className="fixed top-0 left-0 right-96 h-full bg-black bg-opacity-10 transition-opacity duration-600 z-[9999]"
              onClick={() => {
                setShowSpecificFilterPanel(false)
                setSelectedFilterField(null)
              }}
            />
          )}
          {/* Specific Filter Configuration / Edit Panel */}
          {showSpecificFilterPanel && selectedFilterField && (
            <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300 z-[10000]">
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
                    <TableHeader className="bg-white">
                      <Droppable droppableId="columns-financial-workflow" direction="horizontal">
                        {(provided) => (
                          <TableRow
                            className="border-b border-[#e2e2e2]"
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
                                      `text-[#505050] font-medium group ${snapshot.isDragging ? "bg-[#f9fafb]" : ""}`,
                                      column.key === "actions" && "min-w-[240px] text-right pr-4"
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
                      {paginatedData.map((item) => (
                        <ContextMenu
                          key={item.id}
                          open={openContextMenuRowId === item.id}
                          onOpenChange={(o) =>
                            setOpenContextMenuRowId(o ? item.id : null)
                          }
                        >
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
                                      column.key === "actions" && "min-w-[240px] text-right pr-4"
                                    )}

                                >
                                  {renderCell(item, column.key)}
                                </TableCell>
                              ))}
                            </TableRow>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-64">
                            <FluxMenuItems
                              item={item}
                              onAction={(action) => handleMenuAction(action, item)}
                              components={{ Item: ContextMenuItem, Separator: ContextMenuSeparator }}
                            />
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
                      updateUrlWithPagination(1, Number(value)) // Update URL
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
