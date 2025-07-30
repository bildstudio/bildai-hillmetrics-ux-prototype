"use client"

import { useState, useCallback, useEffect } from "react"
import { X, Plus, Calendar, Hash, FileText, Activity, Clock, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Checkbox } from "@/components/ui/checkbox"

export interface FilterCondition {
  id: string
  field: string
  operator: string
  value: any
  dataType: 'text' | 'number' | 'date' | 'select' | 'boolean'
  category: string
}

interface AdvancedFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: FilterCondition[]) => void
  onClear: () => void
  initialFilters?: FilterCondition[]
}

// Global filters that apply across all data types - based on best practices from Google, GitHub, etc.
const globalFilters = {
  // Universal Status filters (maps to different status fields per data type)
  status: {
    label: "Status",
    icon: Activity,
    type: "select",
    options: [
      "Active", "Success", "Failed", "Processing", "Completed", "Error", 
      "Pending", "Running", "Stopped", "Disabled", "Back office only"
    ],
    operators: ["equals", "in"],
    description: "Filter by item status across all data types",
    mappings: {
      flux: "fluxState",
      fetching: "status", 
      processing: "status",
      content: "status",
      workflow: "status"
    }
  },
  
  // Universal Date filters
  dateRange: {
    label: "Date Range",
    icon: Calendar,
    type: "date",
    operators: ["date_range", "before", "after"],
    description: "Filter by creation or update date",
    mappings: {
      flux: "createdAt",
      fetching: "timestamp",
      processing: "timestamp", 
      content: "createdAt",
      workflow: "started_at"
    }
  },
  
  // Universal ID search
  id: {
    label: "ID",
    icon: Hash,
    type: "text",
    operators: ["equals", "contains", "startsWith"],
    description: "Search by specific ID",
    mappings: {
      flux: "id",
      fetching: "fetchingID",
      processing: "processingID",
      content: "contentID", 
      workflow: "id"
    }
  },
  
  // Universal Name/Title search
  name: {
    label: "Name/Title",
    icon: FileText,
    type: "text", 
    operators: ["contains", "equals", "startsWith", "endsWith"],
    description: "Search by name, title, or description",
    mappings: {
      flux: "name",
      fetching: "fluxName", // Derived field
      processing: "fluxName", // Derived field
      content: "contentName",
      workflow: "flux_name"
    }
  },
  
  // Universal Duration filters (for performance analysis)
  duration: {
    label: "Duration",
    icon: Clock,
    type: "select",
    options: ["< 1 minute", "1-5 minutes", "5-15 minutes", "15+ minutes"],
    operators: ["equals", "in"],
    description: "Filter by processing or execution time",
    mappings: {
      fetching: "durationBucket",
      processing: "durationBucket", 
      workflow: "durationBucket"
    }
  },
  
  // File/Content specific (only shows when relevant)
  fileType: {
    label: "File Type",
    icon: FileText,
    type: "select",
    options: ["pdf", "xlsx", "csv", "txt", "json", "xml", "doc", "docx"],
    operators: ["equals", "in"],
    description: "Filter by file type",
    mappings: {
      content: "fileType"
    },
    showForCategories: ["content"] // Only show for content
  }
}

// Data type definitions based on the grid analysis
const filterOptions = {
  // Flux/Reports data
  flux: {
    label: "Flux Data",
    icon: Activity,
    fields: {
      id: { label: "Flux ID", type: "text", operators: ["contains", "equals", "startsWith"] },
      name: { label: "Flux Name", type: "text", operators: ["contains", "equals", "startsWith", "endsWith"] },
      fluxState: { label: "Status", type: "select", options: ["Active", "Back office only", "Disabled"], operators: ["equals", "in"] },
      financialType: { label: "Financial Type", type: "select", options: ["Bench", "Bond", "Commodity", "Cryptocurrency", "Derivative", "ETF", "Forex", "Fund", "PrivateEquity", "Spacs", "StructuredProduct", "Undefined"], operators: ["equals", "in"] },
      fluxType: { label: "Flux Type", type: "text", operators: ["contains", "equals"] },
      source: { label: "Source", type: "text", operators: ["contains", "equals"] },
      fetchingStatus: { label: "Fetching Status", type: "text", operators: ["contains", "equals"] },
      processingStatus: { label: "Processing Status", type: "text", operators: ["contains", "equals"] },
      numberOfFetchingTimes: { label: "Fetching Times", type: "number", operators: ["greaterThan", "lessThan", "equals"] },
      numberOfSuccessFetching: { label: "Successful Fetches", type: "number", operators: ["greaterThan", "lessThan", "equals"] },
      numberOfErrorFetching: { label: "Error Fetches", type: "number", operators: ["greaterThan", "lessThan", "equals"] },
      createdAt: { label: "Created Date", type: "date", operators: ["before", "after", "date_range"] },
      lastFetchingDate: { label: "Last Fetching Date", type: "date", operators: ["before", "after", "date_range"] },
      lastProcessingDate: { label: "Last Processing Date", type: "date", operators: ["before", "after", "date_range"] }
    }
  },
  
  // Fetching history data  
  fetching: {
    label: "Fetching History",
    icon: Hash,
    fields: {
      fetchingID: { label: "Fetching ID", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      fluxID: { label: "Flux ID", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      status: { label: "Status", type: "select", options: ["Success", "Failed", "Currently fetching"], operators: ["equals", "in"] },
      timestamp: { label: "Start Date", type: "date", operators: ["before", "after", "date_range"] },
      completedAt: { label: "Completed Date", type: "date", operators: ["before", "after", "date_range"] },
      progress: { label: "Progress", type: "select", options: ["0% - 25%", "26% - 50%", "51% - 75%", "76% - 100%"], operators: ["progress_ranges"] },
      fetchingTimeInSeconds: { label: "Duration", type: "select", options: ["0-1 min", "1-2 min", "2-5 min", "5-10 min", "10-20 min", "20+ min"], operators: ["duration_ranges"] },
      numberOfContent: { label: "Content Count", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      errorMessage: { label: "Has Errors", type: "boolean", operators: ["error_contains"] }
    }
  },

  // Processing history data
  processing: {
    label: "Processing History", 
    icon: Activity,
    fields: {
      processingID: { label: "Processing ID", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      fluxID: { label: "Flux ID", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      fetchingID: { label: "Fetching ID", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      status: { label: "Status", type: "select", options: ["Success", "Failed", "Currently processing"], operators: ["equals", "in"] },
      timestamp: { label: "Start Date", type: "date", operators: ["before", "after", "date_range"] },
      completedAt: { label: "Completed Date", type: "date", operators: ["before", "after", "date_range"] },
      progress: { label: "Progress", type: "select", options: ["0% - 25%", "26% - 50%", "51% - 75%", "76% - 100%"], operators: ["progress_ranges"] },
      processingTimeInSeconds: { label: "Duration", type: "select", options: ["0-1 min", "1-2 min", "2-5 min", "5-10 min", "10-20 min", "20+ min"], operators: ["duration_ranges"] },
      numberOfProcessingContent: { label: "Content Count", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      errorMessage: { label: "Has Errors", type: "boolean", operators: ["error_contains"] }
    }
  },

  // Content files data
  content: {
    label: "Content Files",
    icon: FileText,
    fields: {
      contentID: { label: "Content ID", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      fluxID: { label: "Flux ID", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      fetchingID: { label: "Fetching ID", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      status: { label: "Status", type: "text", operators: ["contains", "equals"] },
      contentName: { label: "File Name", type: "text", operators: ["contains", "equals", "startsWith", "endsWith"] },
      fileType: { label: "File Type", type: "select", options: ["pdf", "xlsx", "csv", "txt", "json", "xml"], operators: ["equals", "in"] },
      fileSize: { label: "File Size (bytes)", type: "number", operators: ["greaterThan", "lessThan", "equals"] },
      numberOfProcessing: { label: "Processing Count", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      createdAt: { label: "Created Date", type: "date", operators: ["before", "after", "date_range"] },
      sourceUrl: { label: "Source URL", type: "text", operators: ["contains", "equals"] }
    }
  },

  // Workflow execution data
  workflow: {
    label: "Workflow Execution",
    icon: Activity,
    fields: {
      id: { label: "Execution ID", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      flux_id: { label: "Flux ID", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      flux_name: { label: "Flux Name", type: "text", operators: ["contains", "equals", "startsWith", "endsWith"] },
      run_number: { label: "Run Number", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      status: { label: "Status", type: "text", operators: ["contains", "equals"] },
      progress: { label: "Progress", type: "select", options: ["0% - 25%", "26% - 50%", "51% - 75%", "76% - 100%"], operators: ["progress_ranges"] },
      started_at: { label: "Started Date", type: "date", operators: ["before", "after", "date_range"] },
      completed_at: { label: "Completed Date", type: "date", operators: ["before", "after", "date_range"] },
      duration_active: { label: "Duration", type: "select", options: ["0-1 min", "1-2 min", "2-5 min", "5-10 min", "10-20 min", "20+ min"], operators: ["duration_ranges"] },
      content_count: { label: "Content Count", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      steps: { label: "Steps", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
      last_stage: { label: "Last Stage", type: "text", operators: ["contains", "equals"] }
    }
  }
}

const operatorLabels = {
  contains: "contains",
  equals: "is exactly",
  startsWith: "starts with", 
  endsWith: "ends with",
  greaterThan: "greater than",
  lessThan: "less than",
  before: "before",
  after: "after",
  date_range: "between dates",
  progress_ranges: "progress in range",
  duration_ranges: "duration in range",
  error_contains: "has errors",
  in: "is one of"
}

export default function AdvancedFilterPanel({
  isOpen,
  onClose,
  onApply,
  onClear,
  initialFilters = []
}: AdvancedFilterPanelProps) {
  const [filters, setFilters] = useState<FilterCondition[]>(initialFilters)
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  // Update filters when initialFilters prop changes
  useEffect(() => {
    console.log('AdvancedFilterPanel: initialFilters changed:', initialFilters)
    setFilters(initialFilters)
    // Also set the category if we have filters
    if (initialFilters.length > 0) {
      setSelectedCategory(initialFilters[0].category)
    } else {
      // Reset category when no filters
      setSelectedCategory("")
    }
  }, [initialFilters])

  const addFilter = useCallback(() => {
    const newFilter: FilterCondition = {
      id: `filter-${Date.now()}`,
      field: "",
      operator: "",
      value: "",
      dataType: "text",
      category: selectedCategory || "flux"
    }
    setFilters(prev => [...prev, newFilter])
  }, [selectedCategory])

  const addGlobalFilter = useCallback((globalFilterKey: string) => {
    const globalFilterDef = globalFilters[globalFilterKey as keyof typeof globalFilters]
    if (!globalFilterDef) return

    // Create a global filter that will be mapped to appropriate fields based on selected categories
    const newFilter: FilterCondition = {
      id: `global-filter-${Date.now()}`,
      field: globalFilterKey, // Use the global filter key as field
      operator: globalFilterDef.operators[0], // Default to first operator
      value: globalFilterDef.type === 'date' ? null : '', // Default empty value
      dataType: globalFilterDef.type,
      category: 'global' // Mark as global filter
    }
    setFilters(prev => [...prev, newFilter])
  }, [])

  const updateFilter = useCallback((id: string, updates: Partial<FilterCondition>) => {
    setFilters(prev => prev.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    ))
  }, [])

  const removeFilter = useCallback((id: string) => {
    setFilters(prev => prev.filter(filter => filter.id !== id))
  }, [])

  const handleApply = useCallback(() => {
    const validFilters = filters.filter(f => f.field && f.operator && f.value !== "")
    
    // Expand global filters into specific category filters
    const expandedFilters: FilterCondition[] = []
    
    validFilters.forEach(filter => {
      if (filter.category === 'global') {
        // Global filter - create one filter for each data category it supports
        const globalFilterDef = globalFilters[filter.field as keyof typeof globalFilters]
        if (globalFilterDef?.mappings) {
          Object.entries(globalFilterDef.mappings).forEach(([category, fieldName]) => {
            expandedFilters.push({
              ...filter,
              id: `${filter.id}-${category}`,
              category,
              field: fieldName,
              // Keep the same operator and value
            })
          })
        }
      } else {
        // Regular category-specific filter
        expandedFilters.push(filter)
      }
    })
    
    console.log('AdvancedFilterPanel: Applying filters:', expandedFilters)
    onApply(expandedFilters)
    onClose()
  }, [filters, onApply, onClose])

  const handleClear = useCallback(() => {
    console.log('AdvancedFilterPanel: handleClear called - clearing panel only')
    setFilters([])
    setSelectedCategory("")
    // Don't call onClear() - only clear the panel, not the page filters
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Advanced Search</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Global Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium">Quick Filters</Label>
              <Badge variant="secondary" className="text-xs">Global</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(globalFilters).map(([key, filterDef]) => {
                const Icon = filterDef.icon
                return (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => addGlobalFilter(key)}
                    className="justify-start h-auto p-3 text-left"
                  >
                    <Icon className="h-4 w-4 mr-2 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{filterDef.label}</div>
                      <div className="text-xs text-gray-500 truncate">{filterDef.description}</div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Advanced Filters by Data Type:</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(filterOptions).map(([key, category]) => {
                const Icon = category.icon
                return (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(key)}
                    className="justify-start h-auto p-3"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="text-sm">{category.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Applied Filters {filters.length > 0 && `(${filters.length})`}
              </Label>
              {selectedCategory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFilter}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {filterOptions[selectedCategory as keyof typeof filterOptions]?.label} filter
                </Button>
              )}
            </div>

            {filters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a category and add filters to refine your search</p>
              </div>
            )}

            {filters.map((filter, index) => {
              // Handle global filters differently
              const isGlobalFilter = filter.category === 'global'
              const globalFilterDef = isGlobalFilter ? globalFilters[filter.field as keyof typeof globalFilters] : null
              const category = !isGlobalFilter ? filterOptions[filter.category as keyof typeof filterOptions] : null
              const field = !isGlobalFilter ? category?.fields[filter.field as keyof typeof category.fields] : null
              
              return (
                <div key={filter.id} className="flex items-center gap-3 p-4 border rounded-lg">
                  <Badge variant={isGlobalFilter ? "default" : "secondary"} className="text-xs">
                    {isGlobalFilter ? 'Global' : index + 1}
                  </Badge>

                  {/* Global Filter Display */}
                  {isGlobalFilter && globalFilterDef && (
                    <>
                      <div className="flex items-center gap-2">
                        <globalFilterDef.icon className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{globalFilterDef.label}</span>
                      </div>
                    </>
                  )}

                  {/* Regular Field Selection */}
                  {!isGlobalFilter && (
                    <Select
                      value={filter.field}
                      onValueChange={(value) => {
                        const fieldConfig = category?.fields[value as keyof typeof category.fields]
                        updateFilter(filter.id, {
                          field: value,
                          dataType: fieldConfig?.type as any,
                          operator: "",
                          value: ""
                        })
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {category && Object.entries(category.fields).map(([key, fieldConfig]) => (
                          <SelectItem key={key} value={key}>
                            {fieldConfig.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Operator Selection */}
                  {filter.field && (
                    <Select
                      value={filter.operator}
                      onValueChange={(value) => updateFilter(filter.id, { operator: value, value: "" })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {(isGlobalFilter ? globalFilterDef?.operators : field?.operators)?.map(op => (
                          <SelectItem key={op} value={op}>
                            {operatorLabels[op as keyof typeof operatorLabels] || op}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Value Input */}
                  {filter.field && filter.operator && (
                    <div className="flex-1">
                      {(isGlobalFilter ? globalFilterDef?.type : field?.type) === 'select' ? (
                        <Select
                          value={filter.value}
                          onValueChange={(value) => updateFilter(filter.id, { value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select value" />
                          </SelectTrigger>
                          <SelectContent>
                            {(isGlobalFilter ? globalFilterDef?.options : field?.options)?.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (isGlobalFilter ? globalFilterDef?.type : field?.type) === 'date' ? (
                        <DatePickerWithRange
                          value={filter.value}
                          onChange={(value) => updateFilter(filter.id, { value })}
                        />
                      ) : (isGlobalFilter ? globalFilterDef?.type : field?.type) === 'boolean' ? (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={filter.value}
                            onCheckedChange={(checked) => updateFilter(filter.id, { value: checked })}
                          />
                          <Label className="text-sm">Yes</Label>
                        </div>
                      ) : (
                        <Input
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          placeholder={`Enter ${field?.label.toLowerCase()}`}
                          type={field?.type === 'number' ? 'number' : 'text'}
                        />
                      )}
                    </div>
                  )}

                  {/* Remove Filter */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFilter(filter.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={handleClear}>
            Clear all
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={filters.filter(f => f.field && f.operator && f.value !== "").length === 0}
            >
              Apply filters ({filters.filter(f => f.field && f.operator && f.value !== "").length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
