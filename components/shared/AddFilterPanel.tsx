"use client"

import { useState, useCallback } from "react"
import { X, Plus, Calendar, Hash, FileText, Activity, Clock, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Checkbox } from "@/components/ui/checkbox"

export interface AppliedFilter {
  id: string
  field: string
  operator: string
  value: any
  label: string
}

interface AddFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filter: AppliedFilter) => void
  editingFilter?: AppliedFilter | null
  gridType: 'normalization' | 'refinement' | 'calculation'
}

const filterFields = {
  normalization: [
    { key: "id", label: "ID", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "flux_name", label: "Flux Name", type: "text", operators: ["contains", "equals", "startsWith", "endsWith"] },
    { key: "run_number", label: "Run Number", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "status", label: "Status", type: "select", options: ["Success", "Failed", "InProgress", "Created"], operators: ["equals", "in"] },
    { key: "progress", label: "Progress", type: "select", options: ["0-25%", "26-50%", "51-75%", "76-100%"], operators: ["range"] },
    { key: "started_at", label: "Started Date", type: "date", operators: ["before", "after", "date_range"] },
    { key: "completed_at", label: "Completed Date", type: "date", operators: ["before", "after", "date_range"] },
    { key: "duration_minutes", label: "Duration (min)", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "content_count", label: "Content Count", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "sub_process_count", label: "Sub Processes", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "error_message", label: "Has Errors", type: "boolean", operators: ["exists", "not_exists"] }
  ],
  refinement: [
    { key: "id", label: "ID", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "flux_name", label: "Flux Name", type: "text", operators: ["contains", "equals", "startsWith", "endsWith"] },
    { key: "run_number", label: "Run Number", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "status", label: "Status", type: "select", options: ["Success", "Failed", "InProgress", "Created"], operators: ["equals", "in"] },
    { key: "progress", label: "Progress", type: "select", options: ["0-25%", "26-50%", "51-75%", "76-100%"], operators: ["range"] },
    { key: "started_at", label: "Started Date", type: "date", operators: ["before", "after", "date_range"] },
    { key: "completed_at", label: "Completed Date", type: "date", operators: ["before", "after", "date_range"] },
    { key: "duration_minutes", label: "Duration (min)", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "content_count", label: "Content Count", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "sub_process_count", label: "Sub Processes", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "error_message", label: "Has Errors", type: "boolean", operators: ["exists", "not_exists"] }
  ],
  calculation: [
    { key: "id", label: "ID", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "flux_name", label: "Flux Name", type: "text", operators: ["contains", "equals", "startsWith", "endsWith"] },
    { key: "run_number", label: "Run Number", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "status", label: "Status", type: "select", options: ["Success", "Failed", "InProgress", "Created"], operators: ["equals", "in"] },
    { key: "progress", label: "Progress", type: "select", options: ["0-25%", "26-50%", "51-75%", "76-100%"], operators: ["range"] },
    { key: "started_at", label: "Started Date", type: "date", operators: ["before", "after", "date_range"] },
    { key: "completed_at", label: "Completed Date", type: "date", operators: ["before", "after", "date_range"] },
    { key: "duration_minutes", label: "Duration (min)", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "content_count", label: "Content Count", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "sub_process_count", label: "Sub Processes", type: "number", operators: ["equals", "greaterThan", "lessThan"] },
    { key: "error_message", label: "Has Errors", type: "boolean", operators: ["exists", "not_exists"] }
  ]
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
  range: "in range",
  exists: "has value",
  not_exists: "is empty",
  in: "is one of"
}

export default function AddFilterPanel({
  isOpen,
  onClose,
  onApply,
  editingFilter,
  gridType
}: AddFilterPanelProps) {
  const [field, setField] = useState(editingFilter?.field || "")
  const [operator, setOperator] = useState(editingFilter?.operator || "")
  const [value, setValue] = useState(editingFilter?.value || "")

  const fields = filterFields[gridType]
  const selectedField = fields.find(f => f.key === field)

  const handleApply = useCallback(() => {
    if (!field || !operator || (value === "" && operator !== "exists" && operator !== "not_exists")) {
      return
    }

    const fieldConfig = fields.find(f => f.key === field)
    let label = `${fieldConfig?.label} ${operatorLabels[operator as keyof typeof operatorLabels]}`
    
    if (operator !== "exists" && operator !== "not_exists") {
      if (fieldConfig?.type === "select" && fieldConfig.options) {
        label += ` ${Array.isArray(value) ? value.join(", ") : value}`
      } else {
        label += ` ${value}`
      }
    }

    const filter: AppliedFilter = {
      id: editingFilter?.id || `filter-${Date.now()}`,
      field,
      operator,
      value,
      label
    }

    onApply(filter)
    onClose()
  }, [field, operator, value, editingFilter, fields, onApply, onClose])

  const handleClose = useCallback(() => {
    setField("")
    setOperator("")
    setValue("")
    onClose()
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">
              {editingFilter ? 'Edit Filter' : 'Add Filter'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Field Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Field</Label>
            <Select value={field} onValueChange={(value) => {
              setField(value)
              setOperator("")
              setValue("")
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select field to filter by" />
              </SelectTrigger>
              <SelectContent>
                {fields.map(fieldConfig => (
                  <SelectItem key={fieldConfig.key} value={fieldConfig.key}>
                    {fieldConfig.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator Selection */}
          {field && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Condition</Label>
              <Select value={operator} onValueChange={(value) => {
                setOperator(value)
                setValue("")
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {selectedField?.operators.map(op => (
                    <SelectItem key={op} value={op}>
                      {operatorLabels[op as keyof typeof operatorLabels] || op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Value Input */}
          {field && operator && operator !== "exists" && operator !== "not_exists" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Value</Label>
              {selectedField?.type === 'select' ? (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedField.options?.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : selectedField?.type === 'date' ? (
                <DatePickerWithRange
                  value={value}
                  onChange={setValue}
                />
              ) : selectedField?.type === 'boolean' ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={value}
                    onCheckedChange={setValue}
                  />
                  <Label className="text-sm">Yes</Label>
                </div>
              ) : (
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={`Enter ${selectedField?.label.toLowerCase()}`}
                  type={selectedField?.type === 'number' ? 'number' : 'text'}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={!field || !operator || (value === "" && operator !== "exists" && operator !== "not_exists")}
          >
            {editingFilter ? 'Update Filter' : 'Add Filter'}
          </Button>
        </div>
      </div>
    </div>
  )
}
