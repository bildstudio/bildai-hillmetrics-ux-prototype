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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { HorizontalScroller } from "@/components/horizontal-scroller"
import { commonStatusMap } from "@/lib/status-config"
import { Progress } from "@/components/ui/progress"
import { format, parseISO, subDays, startOfDay, endOfDay } from "date-fns"
import { createPortal } from "react-dom"
import { Badge } from "@/components/ui/badge"
import { useViewBlade } from "@/lib/view-blade-context"
import { useBladeStack } from "@/lib/blade-stack-context"
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
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import FluxDetailsInfoPanel from "../processing-history/FluxDetailsInfoPanel"
import ColumnsPanel from "@/components/shared/ColumnsPanel"
import TableColumnHeader from "@/components/table-column-header"
import AddFilterPanel, { type AppliedFilter } from "@/components/shared/AddFilterPanel"
import SavedFiltersPanel, { type SavedFilter } from "@/components/shared/SavedFiltersPanel"

// Calculation data interface
interface CalculationHistoryData {
  id: number
  flux_id: number
  flux_name: string | null
  run_number: number
  status: string
  progress: number | null
  started_at: string
  completed_at: string | null
  duration_minutes: number | null
  content_count: number | null
  error_message: string | null
  stage_type: string
  stage_order: number
  sub_process_count: number | null
}

type SortDirection = "asc" | "desc" | null
type ColumnKey = keyof CalculationHistoryData | "view"

interface Column {
  key: ColumnKey
  label: string
  hidden?: boolean
  pinned?: "left" | "right"
}

// Remove duplicate interfaces since they're imported from shared components

interface CalculationHistoryGridProps {
  status?: string | null
  durationBucket?: string | null
  date?: string | null
  fluxId?: string | null
  onViewCalculation?: (id: number, fluxId?: number, name?: string) => void
  onViewWorkflow?: (item: CalculationHistoryData) => void
}

const defaultColumns: Column[] = [
  { key: "id", label: "ID" },
  { key: "flux_name", label: "Flux Name" },
  { key: "run_number", label: "Run #" },
  { key: "status", label: "Status" },
  { key: "progress", label: "Progress" },
  { key: "started_at", label: "Started At" },
  { key: "completed_at", label: "Completed At" },
  { key: "duration_minutes", label: "Duration" },
  { key: "content_count", label: "Content Count" },
  { key: "sub_process_count", label: "Sub Processes" },
  { key: "error_message", label: "Error Message" },
  { key: "view", label: "Actions", pinned: "right" },
]

export function CalculationHistoryGrid({
  status,
  durationBucket,
  date,
  fluxId,
  onViewCalculation,
  onViewWorkflow,
}: CalculationHistoryGridProps) {
  const [data, setData] = useState<CalculationHistoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<ColumnKey | null>("started_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [columns, setColumns] = useState<Column[]>(defaultColumns)
  const [showColumnsPanel, setShowColumnsPanel] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([])
  const [showAddFilterPanel, setShowAddFilterPanel] = useState(false)
  const [showSavedFiltersPanel, setShowSavedFiltersPanel] = useState(false)
  const [editingFilter, setEditingFilter] = useState<AppliedFilter | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null)
  const [openDropdownRowId, setOpenDropdownRowId] = useState<number | null>(null)
  const [openContextMenuRowId, setOpenContextMenuRowId] = useState<number | null>(null)

  // Generate mock data
  const generateMockData = useCallback((): CalculationHistoryData[] => {
    const mockData: CalculationHistoryData[] = []
    const statuses = ["Success", "Failed", "InProgress", "Created"]
    
    for (let i = 1; i <= 20; i++) {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
      const startDate = subDays(new Date(), Math.floor(Math.random() * 30))
      const endDate = randomStatus === "Success" || randomStatus === "Failed" 
        ? new Date(startDate.getTime() + Math.random() * 3600000) // Random duration up to 1 hour
        : null
      
      mockData.push({
        id: 5000 + i,
        flux_id: 100 + Math.floor(Math.random() * 50),
        flux_name: `Calculation Flux ${100 + Math.floor(Math.random() * 50)}`,
        run_number: Math.floor(Math.random() * 1000) + 1,
        status: randomStatus,
        progress: randomStatus === "Success" ? 100 : 
                 randomStatus === "Failed" ? Math.floor(Math.random() * 80) :
                 randomStatus === "InProgress" ? Math.floor(Math.random() * 90) + 10 : 0,
        started_at: startDate.toISOString(),
        completed_at: endDate?.toISOString() || null,
        duration_minutes: endDate ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) : null,
        content_count: Math.floor(Math.random() * 1000) + 10,
        error_message: randomStatus === "Failed" ? `Calculation error ${Math.floor(Math.random() * 100)}` : null,
        stage_type: "Calculation Stage",
        stage_order: 5,
        sub_process_count: Math.floor(Math.random() * 50) + 5,
      })
    }
    
    return mockData
  }, [])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        let mockData = generateMockData()
        
        // Apply URL filters
        if (status) {
          mockData = mockData.filter(item => item.status === status)
        }
        if (fluxId) {
          mockData = mockData.filter(item => item.flux_id === parseInt(fluxId))
        }
        if (date) {
          const targetDate = date === 'today' ? new Date() : new Date(date)
          mockData = mockData.filter(item => {
            const itemDate = new Date(item.started_at)
            return itemDate.toDateString() === targetDate.toDateString()
          })
        }
        if (durationBucket) {
          mockData = mockData.filter(item => {
            if (!item.duration_minutes) return false
            const duration = item.duration_minutes
            switch(durationBucket) {
              case '0-1min': return duration <= 1
              case '1-5min': return duration > 1 && duration <= 5
              case '5-15min': return duration > 5 && duration <= 15
              case '15-60min': return duration > 15 && duration <= 60
              case '60min+': return duration > 60
              default: return true
            }
          })
        }
        
        setData(mockData)
        setError(null)
      } catch (err) {
        setError("Failed to load calculation history")
        console.error("Error loading data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [status, durationBucket, date, fluxId, generateMockData])

  // Apply additional filters from filter panels
  const applyFilters = useCallback((data: CalculationHistoryData[], filters: AppliedFilter[]) => {
    return data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field as keyof CalculationHistoryData]
        
        switch (filter.operator) {
          case 'equals':
            return String(value) === String(filter.value)
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase())
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase())
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase())
          case 'greaterThan':
            return Number(value) > Number(filter.value)
          case 'lessThan':
            return Number(value) < Number(filter.value)
          case 'before':
            return new Date(String(value)) < new Date(filter.value)
          case 'after':
            return new Date(String(value)) > new Date(filter.value)
          case 'exists':
            return value !== null && value !== undefined && value !== ''
          case 'not_exists':
            return value === null || value === undefined || value === ''
          case 'range':
            if (filter.field === 'progress') {
              const progress = Number(value)
              switch (filter.value) {
                case '0-25%': return progress >= 0 && progress <= 25
                case '26-50%': return progress >= 26 && progress <= 50
                case '51-75%': return progress >= 51 && progress <= 75
                case '76-100%': return progress >= 76 && progress <= 100
                default: return true
              }
            }
            return true
          case 'in':
            return Array.isArray(filter.value) ? filter.value.includes(String(value)) : String(value) === String(filter.value)
          default:
            return true
        }
      })
    })
  }, [])

  // Get filtered data
  const filteredData = applyFilters(data, appliedFilters)

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

  const handleSort = (columnKey: ColumnKey) => {
    if (sortField === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc")
      if (sortDirection === "desc") {
        setSortField(null)
      }
    } else {
      setSortField(columnKey)
      setSortDirection("asc")
    }
  }

  const handleSortAsc = (columnKey: ColumnKey) => {
    setSortField(columnKey)
    setSortDirection("asc")
  }

  const handleSortDesc = (columnKey: ColumnKey) => {
    setSortField(columnKey)
    setSortDirection("desc")
  }

  const getSortIcon = (columnKey: ColumnKey) => {
    if (sortField !== columnKey) return null
    return sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  const openFilterForColumn = (columnKey: ColumnKey) => {
    // Handle opening filter for specific column
    setShowAddFilterPanel(true)
  }

  const pinColumn = (columnKey: ColumnKey, position: "left" | "right") => {
    setColumns(columns.map(col => 
      col.key === columnKey 
        ? { ...col, pinned: position }
        : col
    ))
  }

  const unpinColumn = (columnKey: ColumnKey) => {
    setColumns(columns.map(col => 
      col.key === columnKey 
        ? { ...col, pinned: undefined }
        : col
    ))
  }

  const hideColumn = (columnKey: ColumnKey) => {
    setColumns(columns.map(col => 
      col.key === columnKey 
        ? { ...col, hidden: true }
        : col
    ))
  }

  const handleEditFilter = (filter: AppliedFilter) => {
    setEditingFilter(filter)
    setShowAddFilterPanel(true)
  }

  const handleRemoveFilter = (filterId: string) => {
    setAppliedFilters(appliedFilters.filter(f => f.id !== filterId))
  }

  const handleAddFilter = (filter: AppliedFilter) => {
    if (editingFilter) {
      setAppliedFilters(appliedFilters.map(f => f.id === filter.id ? filter : f))
    } else {
      setAppliedFilters([...appliedFilters, filter])
    }
  }

  const handleApplySavedFilters = (filters: AppliedFilter[]) => {
    setAppliedFilters(filters)
  }

  const totalCount = filteredData.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const renderCell = (item: CalculationHistoryData, columnKey: ColumnKey) => {
    const value = item[columnKey as keyof CalculationHistoryData]
    
    switch (columnKey) {
      case "id":
        return (
          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gray-50 border-gray-200 text-gray-700 font-mono">
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
        return <span className="text-sm">{item.status}</span>
      case "started_at":
      case "completed_at":
        if (!value) return "–"
        try {
          return format(parseISO(value as string), "dd MMM yyyy HH:mm")
        } catch {
          return "Invalid Date"
        }
      case "duration_minutes":
        if (value === null || value === undefined) return "–"
        return `${Math.round((value as number))} min`
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
      case "flux_name":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm cursor-default">
                  {value || "–"}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{value || "No flux name"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      case "view": {
        return (
          <div className="flex items-center justify-end space-x-1 pr-2">
            {(hoveredRowId === item.id || openDropdownRowId === item.id) && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                        onClick={() => onViewWorkflow?.(item)}
                      >
                        <FileTextIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View workflow details</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                        onClick={() => onViewCalculation?.(item.id, item.flux_id, item.flux_name || undefined)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View content</TooltipContent>
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
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuItem onClick={() => onViewCalculation?.(item.id, item.flux_id, item.flux_name || undefined)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewWorkflow?.(item)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Workflow
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Info className="h-4 w-4 mr-2" />
                  Flux Info
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }
      default:
        return String(value ?? "–")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading calculation history...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center text-gray-500">
        <History className="h-16 w-16 mb-4 text-gray-300" />
        <p className="text-lg">No calculation history found.</p>
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
            <Button variant="ghost" size="icon">
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
                    <Droppable droppableId="columns-calculation" direction="horizontal">
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
                                    (col.key === "id" ||
                                      col.key === "flux_id" ||
                                      col.key === "run_number" ||
                                      col.key === "content_count") && "w-[60px]",
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
                                    showFilter={true}
                                    filterDisabled={false}
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
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item) => (
                        <ContextMenu
                          key={item.id}
                          open={openContextMenuRowId === item.id}
                          onOpenChange={(o) =>
                            setOpenContextMenuRowId(o ? item.id : null)
                          }
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
                                  className={cn(
                                    col.key === "view" && "min-w-[240px] text-right pr-2",
                                    (col.key === "id" ||
                                      col.key === "flux_id" ||
                                      col.key === "run_number" ||
                                      col.key === "content_count") && "w-[60px]",
                                  )}
                                >
                                  {renderCell(item, col.key)}
                                </TableCell>
                              ))}
                            </TableRow>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuLabel>Calculation Actions</ContextMenuLabel>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => onViewCalculation?.(item.id, item.flux_id, item.flux_name || undefined)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => onViewWorkflow?.(item)}>
                              <FileText className="h-4 w-4 mr-2" />
                              View Workflow
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={getOrderedColumns().length} className="h-96">
                          <div className="flex flex-col items-center justify-center text-center text-gray-500">
                            <History className="h-16 w-16 mb-4 text-gray-300" />
                            <p className="text-lg">No calculation history found.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </DragDropContext>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Columns Panel */}
      {showColumnsPanel && (
        <ColumnsPanel
          columns={columns}
          onColumnsChange={setColumns}
          onClose={() => setShowColumnsPanel(false)}
        />
      )}

      {/* Add Filter Panel */}
      <AddFilterPanel
        isOpen={showAddFilterPanel}
        onClose={() => {
          setShowAddFilterPanel(false)
          setEditingFilter(null)
        }}
        onApply={handleAddFilter}
        editingFilter={editingFilter}
        gridType="calculation"
      />

      {/* Saved Filters Panel */}
      <SavedFiltersPanel
        isOpen={showSavedFiltersPanel}
        onClose={() => setShowSavedFiltersPanel(false)}
        onApplyFilter={handleApplySavedFilters}
        currentFilters={appliedFilters}
        gridType="calculation"
      />
    </div>
  )
}
