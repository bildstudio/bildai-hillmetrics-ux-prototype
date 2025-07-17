"use client"

import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import {
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { HorizontalScroller } from "@/components/horizontal-scroller"
import { cn } from "@/lib/utils"

interface ActivityFiltersProps {
  onFilterChange: (filters: { field: string; operator: string; value: any }[]) => void
  initialFilters?: AppliedFilter[]
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

const activityTypeOptions = [
  "fetching",
  "processing",
  "normalization",
  "refinement",
  "calculation",
]
const statusOptions = ["Success", "Currently fetching / processing"]
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
  "(Processing) Unable To Deserialize Json Content",
  "(Processing) Different Data For A Same Product",
  "(Processing) Currency Not Found",
  "(Processing) Mic Not Found",
  "(Processing) No Data To Process",
  "(Processing) Link With Raw Database Is Not Set",
  "(Processing) Exception Error",
  "(Processing) Row Count Mismatch",
  "(Processing) Insertion Error",
  "(Processing) Financial Identifier Not Found",
  "(Fetching) Unsupported Content Location",
  "(Fetching) No Attachment",
  "(Fetching) Attachment Found But Does Not Match Attachment Rule",
  "(Fetching) Email Fetch Error",
  "(Fetching) Error While Processing Email",
  "(Fetching) Error While Processing Attachment",
  "(Fetching) Http Fetch Error",
  "(Fetching) One Attachment For Multiple Flux",
  "(Fetching) Inconsistent Metadata",
  "(Fetching) Flux Does Not Match Mail",
  "(Fetching) Unable To Deserialize Json Content",
  "(Fetching) Error When Trying To Link With Raw Database",
  "(Fetching) Already Exist In Raw Database",
  "(Fetching) Configuration Error",
  "(Fetching) Empty Content",
  "(Fetching) Custom Implementation Error",
  "(Fetching) Unknown Flux Type",
  "(Fetching) Undefined",
]

const availableFilterFields: FilterField[] = [
  { key: "type", label: "Type of activity", type: "activitytype" },
  { key: "status", label: "Status", type: "status" },
  { key: "progress", label: "Progress", type: "progress" },
  { key: "duration", label: "Duration", type: "duration" },
  { key: "timestamp", label: "Started time", type: "timerange" },
  { key: "completedAt", label: "End time", type: "timerange" },
  { key: "errorMessage", label: "Type of error", type: "errortype" },
]

export function ActivityFilters({ onFilterChange, initialFilters = [] }: ActivityFiltersProps) {
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>(initialFilters)
  const [showAddFilterPanel, setShowAddFilterPanel] = useState(false)
  const [selectedFilterField, setSelectedFilterField] = useState<FilterField | null>(null)
  const [showSpecificFilterPanel, setShowSpecificFilterPanel] = useState(false)
  const [editingFilter, setEditingFilter] = useState<AppliedFilter | null>(null)

  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([])
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

  const isFirstRender = useRef(true)
  useEffect(() => {
    setAppliedFilters(initialFilters)
  }, [initialFilters])
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const serverFilters = appliedFilters.map((f) => ({
      field: f.field,
      operator: f.operator,
      value: f.value,
    }))
    onFilterChange(serverFilters)
  }, [appliedFilters, onFilterChange])

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

  function handleSelectFilterField(field: FilterField) {
    setSelectedFilterField(field)
    setShowSpecificFilterPanel(true)
    setEditingFilter(null)

    setSelectedActivityTypes([])
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

  function handleEditFilter(filter: AppliedFilter) {
    const field = availableFilterFields.find((f) => f.key === filter.field)
    if (!field) return

    setSelectedFilterField(field)
    setEditingFilter(filter)

    switch (field.type) {
      case "activitytype":
        setSelectedActivityTypes(Array.isArray(filter.value) ? filter.value : [String(filter.value)])
        break
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
        const isStart = field.key === "timestamp"
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
          const matching = timeRangeOptions.find((opt) => {
            if (opt.value === "custom") return false
            const dr = getDateRangeForTimeOption(opt.value)
            return dr && JSON.stringify(dr) === JSON.stringify(filter.value)
          })
          if (isStart) {
            setSelectedStartTimeRange(matching?.value || "")
          } else {
            setSelectedEndTimeRange(matching?.value || "")
          }
        }
        break
      case "errortype":
        setSelectedErrorTypes(Array.isArray(filter.value) ? filter.value : [String(filter.value)])
        break
    }

    setShowSpecificFilterPanel(true)
    setShowAddFilterPanel(false)
  }

  function getDateRangeForTimeOption(option: string) {
    const now = new Date()
    switch (option) {
      case "today":
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date(now.setHours(23, 59, 59, 999)) }
      case "last7days":
        return { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() }
      case "last15days":
        return { start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), end: new Date() }
      case "last30days":
        return { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }
      case "last2months":
        return { start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), end: new Date() }
      default:
        return null
    }
  }

  const handleBackToFilterList = () => {
    setShowSpecificFilterPanel(false)
    setSelectedFilterField(null)
  }

  function handleApplySpecificFilter() {
    if (!selectedFilterField) return

    let filterValue: any
    let operator = ""
    let label = ""

    switch (selectedFilterField.type) {
      case "activitytype":
        if (selectedActivityTypes.length === 0) return
        filterValue = selectedActivityTypes
        operator = "in"
        label = `Type: ${selectedActivityTypes.join(", ")}`
        break
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
        const isStart = selectedFilterField.key === "timestamp"
        const selectedRange = isStart ? selectedStartTimeRange : selectedEndTimeRange
        const after = isStart ? startTimeAfter : endTimeAfter
        const before = isStart ? startTimeBefore : endTimeBefore
        if (!selectedRange) return
        if (selectedRange === "custom") {
          if (!after && !before) return
          filterValue = { after, before }
          operator = "custom_date_range"
        } else {
          const dr = getDateRangeForTimeOption(selectedRange)
          if (!dr) return
          filterValue = dr
          operator = "date_range"
        }
        label = `${selectedFilterField.label}: ${selectedRange}`
        break
      case "errortype":
        if (selectedErrorTypes.length === 0) return
        filterValue = selectedErrorTypes
        operator = "error_contains"
        label = `Error: ${selectedErrorTypes.join(", ")}`
        break
      default:
        return
    }

    if (editingFilter) {
      setAppliedFilters((prev) =>
        prev.map((f) =>
          f.id === editingFilter.id ? { ...f, operator, value: filterValue, label } : f,
        ),
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

    setSelectedActivityTypes([])
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

  function renderSpecificFilterContent() {
    if (!selectedFilterField) return null
    switch (selectedFilterField.type) {
      case "activitytype":
        return (
          <div className="space-y-2">
            {activityTypeOptions.map((t) => (
              <div key={t} className="flex items-center gap-2">
                <Checkbox
                  id={`type-${t}`}
                  checked={selectedActivityTypes.includes(t)}
                  onCheckedChange={() =>
                    setSelectedActivityTypes((prev) =>
                      prev.includes(t) ? prev.filter((s) => s !== t) : [...prev, t],
                    )
                  }
                />
                <label htmlFor={`type-${t}`}>{t}</label>
              </div>
            ))}
          </div>
        )
      case "status":
        return (
          <div className="space-y-2">
            {statusOptions.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <Checkbox
                  id={`status-${s}`}
                  checked={selectedStatuses.includes(s)}
                  onCheckedChange={() =>
                    setSelectedStatuses((prev) =>
                      prev.includes(s) ? prev.filter((v) => v !== s) : [...prev, s],
                    )
                  }
                />
                <label htmlFor={`status-${s}`}>{s}</label>
              </div>
            ))}
          </div>
        )
      case "progress":
        return (
          <div className="space-y-2">
            {progressOptions.map((p) => (
              <div key={p.label} className="flex items-center gap-2">
                <Checkbox
                  id={`progress-${p.label}`}
                  checked={selectedProgressRanges.includes(p.label)}
                  onCheckedChange={() =>
                    setSelectedProgressRanges((prev) =>
                      prev.includes(p.label) ? prev.filter((r) => r !== p.label) : [...prev, p.label],
                    )
                  }
                />
                <label htmlFor={`progress-${p.label}`}>{p.label}</label>
              </div>
            ))}
          </div>
        )
      case "duration":
        return (
          <div className="space-y-2">
            {durationOptions.map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <Checkbox
                  id={`dur-${d.label}`}
                  checked={selectedDurationRanges.includes(d.label)}
                  onCheckedChange={() =>
                    setSelectedDurationRanges((prev) =>
                      prev.includes(d.label) ? prev.filter((r) => r !== d.label) : [...prev, d.label],
                    )
                  }
                />
                <label htmlFor={`dur-${d.label}`}>{d.label}</label>
              </div>
            ))}
          </div>
        )
      case "timerange":
        const isStart = selectedFilterField.key === "timestamp"
        const rangeVal = isStart ? selectedStartTimeRange : selectedEndTimeRange
        const afterVal = isStart ? startTimeAfter : endTimeAfter
        const beforeVal = isStart ? startTimeBefore : endTimeBefore
        const setRange = isStart ? setSelectedStartTimeRange : setSelectedEndTimeRange
        const setAfter = isStart ? setStartTimeAfter : setEndTimeAfter
        const setBefore = isStart ? setStartTimeBefore : setEndTimeBefore
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {timeRangeOptions.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`time-${opt.value}`}
                    checked={rangeVal === opt.value}
                    onCheckedChange={() => setRange(rangeVal === opt.value ? "" : opt.value)}
                  />
                  <label htmlFor={`time-${opt.value}`}>{opt.label}</label>
                </div>
              ))}
            </div>
            {rangeVal === "custom" && (
              <div className="space-y-2 pl-6">
                <div>
                  <label className="text-sm font-medium">After:</label>
                  <Input type="date" value={afterVal} onChange={(e) => setAfter(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Before:</label>
                  <Input type="date" value={beforeVal} onChange={(e) => setBefore(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )
      case "errortype":
        return (
          <div className="space-y-2">
            {errorTypeOptions.map((e) => (
              <div key={e} className="flex items-center gap-2">
                <Checkbox
                  id={`err-${e}`}
                  checked={selectedErrorTypes.includes(e)}
                  onCheckedChange={() =>
                    setSelectedErrorTypes((prev) =>
                      prev.includes(e) ? prev.filter((v) => v !== e) : [...prev, e],
                    )
                  }
                />
                <label htmlFor={`err-${e}`}>{e}</label>
              </div>
            ))}
          </div>
        )
      default:
        return null
    }
  }

  function handleRemoveFilter(id: string) {
    setAppliedFilters((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-4">
      <HorizontalScroller>
        <div className="flex items-center space-x-2 py-1">
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
                className="h-5 w-5 p-0 ml-1 -mr-1 text-blue-700 hover:text-blue-900 hover:bg-blue-100/50 rounded-sm opacity-80 group-hover:opacity-100 transition-opacity"
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
            onClick={() => setShowAddFilterPanel(true)}
            className="h-9 px-3 border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add filter
          </Button>
          {appliedFilters.length > 0 && (
            <Button variant="ghost" onClick={() => setAppliedFilters([])} className="h-9 px-3 text-[#5499a2]">
              Clear filters
            </Button>
          )}
        </div>
      </HorizontalScroller>

      {showAddFilterPanel && !editingFilter &&
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

      {showSpecificFilterPanel && selectedFilterField &&
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
                <p className="text-sm text-gray-600">{editingFilter ? "Edit your filter:" : "Configure your filter:"}</p>
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
