"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"

export interface BasicInformationData {
  fluxName: string
  source: string
  comment: string
  description: string
  fetchSchedule: {
    active: boolean
    frequencyType: string
    intervalHours?: number
    intervalMinutes?: number
    dayOfMonth?: number
    startTime?: string
  }
  processSchedule: {
    active: boolean
    frequencyType: string
    intervalDays?: number
    intervalMinutes?: number
    intervalHours?: number
    dayOfMonth?: number
    startTime: string
  }
}

interface BasicInformationFormProps {
  data: BasicInformationData
  onChange: (data: BasicInformationData) => void
}

export function BasicInformationForm({ data, onChange }: BasicInformationFormProps) {
  const updateData = (updates: Partial<BasicInformationData>) => {
    onChange({ ...data, ...updates })
  }

  const updateFetchSchedule = (updates: Partial<BasicInformationData["fetchSchedule"]>) => {
    updateData({
      fetchSchedule: { ...data.fetchSchedule, ...updates },
    })
  }

  const updateProcessSchedule = (updates: Partial<BasicInformationData["processSchedule"]>) => {
    updateData({
      processSchedule: { ...data.processSchedule, ...updates },
    })
  }

  const handleFetchFrequencyChange = (value: string) => {
    let newFetchSchedule = { ...data.fetchSchedule, frequencyType: value }
    // Reset interval/time/dayOfMonth based on new frequency type
    if (value === "Never" || value === "Immediately") {
      newFetchSchedule = {
        ...newFetchSchedule,
        intervalHours: undefined,
        intervalMinutes: undefined,
        dayOfMonth: undefined,
        startTime: undefined,
      }
    } else if (value === "Daily") {
      newFetchSchedule = {
        ...newFetchSchedule,
        intervalMinutes: undefined,
        dayOfMonth: undefined,
        startTime: undefined,
      }
    } else if (value === "Every X Minutes") {
      newFetchSchedule = { ...newFetchSchedule, intervalHours: undefined, dayOfMonth: undefined, startTime: undefined }
    } else if (value === "Every X Hours") {
      newFetchSchedule = {
        ...newFetchSchedule,
        intervalMinutes: undefined,
        dayOfMonth: undefined,
        startTime: undefined,
      }
    } else if (value === "Monthly") {
      newFetchSchedule = { ...newFetchSchedule, intervalHours: undefined, intervalMinutes: undefined }
    } else if (value === "Specific") {
      newFetchSchedule = {
        ...newFetchSchedule,
        intervalHours: undefined,
        intervalMinutes: undefined,
        dayOfMonth: undefined,
      }
    }
    updateFetchSchedule(newFetchSchedule)
  }

  const handleProcessFrequencyChange = (value: string) => {
    let newProcessSchedule = { ...data.processSchedule, frequencyType: value }
    // Reset interval/dayOfMonth based on new frequency type
    if (value === "Never" || value === "Immediately") {
      newProcessSchedule = {
        ...newProcessSchedule,
        intervalDays: undefined,
        intervalMinutes: undefined,
        intervalHours: undefined,
        dayOfMonth: undefined,
      }
    } else if (value === "Daily") {
      newProcessSchedule = {
        ...newProcessSchedule,
        intervalMinutes: undefined,
        intervalHours: undefined,
        dayOfMonth: undefined,
      }
    } else if (value === "Every X Minutes") {
      newProcessSchedule = {
        ...newProcessSchedule,
        intervalDays: undefined,
        intervalHours: undefined,
        dayOfMonth: undefined,
      }
    } else if (value === "Every X Hours") {
      newProcessSchedule = {
        ...newProcessSchedule,
        intervalDays: undefined,
        intervalMinutes: undefined,
        dayOfMonth: undefined,
      }
    } else if (value === "Monthly") {
      newProcessSchedule = {
        ...newProcessSchedule,
        intervalDays: undefined,
        intervalMinutes: undefined,
        intervalHours: undefined,
      }
    } else if (value === "Specific") {
      newProcessSchedule = {
        ...newProcessSchedule,
        intervalDays: undefined,
        intervalMinutes: undefined,
        intervalHours: undefined,
        dayOfMonth: undefined,
      }
    }
    updateProcessSchedule(newProcessSchedule)
  }

  const incrementFetchInterval = (unit: "hours" | "minutes") => {
    if (unit === "hours") {
      updateFetchSchedule({ intervalHours: Math.max(1, (data.fetchSchedule.intervalHours || 0) + 1) })
    } else {
      updateFetchSchedule({ intervalMinutes: Math.max(1, (data.fetchSchedule.intervalMinutes || 0) + 1) })
    }
  }

  const decrementFetchInterval = (unit: "hours" | "minutes") => {
    if (unit === "hours") {
      updateFetchSchedule({ intervalHours: Math.max(1, (data.fetchSchedule.intervalHours || 0) - 1) })
    } else {
      updateFetchSchedule({ intervalMinutes: Math.max(1, (data.fetchSchedule.intervalMinutes || 0) - 1) })
    }
  }

  const incrementProcessInterval = (unit: "days" | "hours" | "minutes") => {
    if (unit === "days") {
      updateProcessSchedule({ intervalDays: Math.max(1, (data.processSchedule.intervalDays || 0) + 1) })
    } else if (unit === "hours") {
      updateProcessSchedule({ intervalHours: Math.max(1, (data.processSchedule.intervalHours || 0) + 1) })
    } else {
      updateProcessSchedule({ intervalMinutes: Math.max(1, (data.processSchedule.intervalMinutes || 0) + 1) })
    }
  }

  const decrementProcessInterval = (unit: "days" | "hours" | "minutes") => {
    if (unit === "days") {
      updateProcessSchedule({ intervalDays: Math.max(1, (data.processSchedule.intervalDays || 0) - 1) })
    } else if (unit === "hours") {
      updateProcessSchedule({ intervalHours: Math.max(1, (data.processSchedule.intervalHours || 0) - 1) })
    } else {
      updateProcessSchedule({ intervalMinutes: Math.max(1, (data.processSchedule.intervalMinutes || 0) - 1) })
    }
  }

  const validateDayOfMonth = (day: number | undefined) => {
    if (day === undefined || day < 1 || day > 31) {
      return "Day of month must be between 1 and 31."
    }
    // Simple warning for months with fewer days
    const currentMonth = new Date().getMonth() // 0-11
    const daysInMonth = new Date(new Date().getFullYear(), currentMonth + 1, 0).getDate()
    if (day > daysInMonth) {
      return `Warning: This script may not run in months with fewer than ${day} days (e.g., February, April, June, September, November).`
    }
    return ""
  }

  const frequencyOptions = ["Never", "Daily", "Immediately", "Every X Minutes", "Every X Hours", "Monthly", "Specific"]

  return (
    <div className="space-y-8">
      {/* Basic Information Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mt-[15px]">
          Basic Information
        </h3>

        {/* Flux name i Source u jednom redu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fluxName">Flux name *</Label>
            <Input
              id="fluxName"
              value={data.fluxName}
              onChange={(e) => updateData({ fluxName: e.target.value })}
              placeholder="Enter flux name"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select value={data.source} onValueChange={(value) => updateData({ source: value })}>
              <SelectTrigger id="source">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
                <SelectItem value="option4">Option 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comment i Description u punoj širini */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Input
              id="comment"
              value={data.comment}
              onChange={(e) => updateData({ comment: e.target.value })}
              placeholder="Enter comment"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => updateData({ description: e.target.value })}
              placeholder="Enter description"
              className="w-full min-h-[100px]"
            />
          </div>
        </div>
      </div>

      {/* Scheduling Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Scheduling</h3>

        {/* Fetch i Process schedule jedno pored drugog */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fetch Schedule */}
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
            <h4 className="text-md font-medium text-gray-800">Fetch schedule</h4>

            <div className="space-y-2">
              <Label>Status</Label>
              <RadioGroup
                value={data.fetchSchedule.active ? "active" : "inactive"}
                onValueChange={(value) => updateFetchSchedule({ active: value === "active" })}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="fetch-active" />
                  <Label htmlFor="fetch-active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="fetch-inactive" />
                  <Label htmlFor="fetch-inactive">Inactive</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Frequency Type</Label>
              <Select value={data.fetchSchedule.frequencyType} onValueChange={handleFetchFrequencyChange}>
                <SelectTrigger id="fetchScheduleFrequency">
                  <SelectValue placeholder="Select frequency type" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(data.fetchSchedule.frequencyType === "Daily" ||
              data.fetchSchedule.frequencyType === "Every X Minutes" ||
              data.fetchSchedule.frequencyType === "Every X Hours") && (
              <div className="space-y-2">
                <Label>
                  {data.fetchSchedule.frequencyType === "Daily" && "Interval (days)"}
                  {data.fetchSchedule.frequencyType === "Every X Minutes" && "Interval (minutes)"}
                  {data.fetchSchedule.frequencyType === "Every X Hours" && "Interval (hours)"}
                </Label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      data.fetchSchedule.frequencyType === "Every X Minutes"
                        ? decrementFetchInterval("minutes")
                        : decrementFetchInterval("hours")
                    }
                    className="h-8 w-8"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={
                      data.fetchSchedule.frequencyType === "Every X Minutes"
                        ? data.fetchSchedule.intervalMinutes || 1
                        : data.fetchSchedule.intervalHours || 1
                    }
                    onChange={(e) => {
                      const value = Math.max(1, Number.parseInt(e.target.value) || 1)
                      if (data.fetchSchedule.frequencyType === "Every X Minutes") {
                        updateFetchSchedule({ intervalMinutes: value })
                      } else {
                        updateFetchSchedule({ intervalHours: value })
                      }
                    }}
                    className="w-20 text-center"
                    min="1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      data.fetchSchedule.frequencyType === "Every X Minutes"
                        ? incrementFetchInterval("minutes")
                        : incrementFetchInterval("hours")
                    }
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {data.fetchSchedule.frequencyType === "Monthly" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fetchDayOfMonth">Day of Month</Label>
                  <Input
                    id="fetchDayOfMonth"
                    type="number"
                    value={data.fetchSchedule.dayOfMonth || ""}
                    onChange={(e) => updateFetchSchedule({ dayOfMonth: Number.parseInt(e.target.value) || undefined })}
                    className="w-full"
                    min="1"
                    max="31"
                  />
                  {data.fetchSchedule.dayOfMonth !== undefined && validateDayOfMonth(data.fetchSchedule.dayOfMonth) && (
                    <p className="text-sm text-red-500">{validateDayOfMonth(data.fetchSchedule.dayOfMonth)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fetchStartTime">Start time</Label>
                  <Input
                    id="fetchStartTime"
                    type="time"
                    value={data.fetchSchedule.startTime || ""}
                    onChange={(e) => updateFetchSchedule({ startTime: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {data.fetchSchedule.frequencyType === "Specific" && (
              <div className="space-y-2">
                <Label htmlFor="fetchSpecificTime">Start time</Label>
                <Input
                  id="fetchSpecificTime"
                  type="time"
                  value={data.fetchSchedule.startTime || ""}
                  onChange={(e) => updateFetchSchedule({ startTime: e.target.value })}
                  className="w-32"
                />
              </div>
            )}
          </div>

          {/* Process Schedule */}
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
            <h4 className="text-md font-medium text-gray-800">Process schedule</h4>

            <div className="space-y-2">
              <Label>Status</Label>
              <RadioGroup
                value={data.processSchedule.active ? "active" : "inactive"}
                onValueChange={(value) => updateProcessSchedule({ active: value === "active" })}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="process-active" />
                  <Label htmlFor="process-active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="process-inactive" />
                  <Label htmlFor="process-inactive">Inactive</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Frequency Type</Label>
              <Select value={data.processSchedule.frequencyType} onValueChange={handleProcessFrequencyChange}>
                <SelectTrigger id="processScheduleFrequency">
                  <SelectValue placeholder="Select frequency type" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(data.processSchedule.frequencyType === "Daily" ||
              data.processSchedule.frequencyType === "Every X Minutes" ||
              data.processSchedule.frequencyType === "Every X Hours") && (
              <div className="space-y-2">
                <Label>
                  {data.processSchedule.frequencyType === "Daily" && "Interval (days)"}
                  {data.processSchedule.frequencyType === "Every X Minutes" && "Interval (minutes)"}
                  {data.processSchedule.frequencyType === "Every X Hours" && "Interval (hours)"}
                </Label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (data.processSchedule.frequencyType === "Daily") decrementProcessInterval("days")
                      else if (data.processSchedule.frequencyType === "Every X Minutes")
                        decrementProcessInterval("minutes")
                      else decrementProcessInterval("hours")
                    }}
                    className="h-8 w-8"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={
                      data.processSchedule.frequencyType === "Daily"
                        ? data.processSchedule.intervalDays || 1
                        : data.processSchedule.frequencyType === "Every X Minutes"
                          ? data.processSchedule.intervalMinutes || 1
                          : data.processSchedule.intervalHours || 1
                    }
                    onChange={(e) => {
                      const value = Math.max(1, Number.parseInt(e.target.value) || 1)
                      if (data.processSchedule.frequencyType === "Daily") {
                        updateProcessSchedule({ intervalDays: value })
                      } else if (data.processSchedule.frequencyType === "Every X Minutes") {
                        updateProcessSchedule({ intervalMinutes: value })
                      } else {
                        updateProcessSchedule({ intervalHours: value })
                      }
                    }}
                    className="w-20 text-center"
                    min="1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (data.processSchedule.frequencyType === "Daily") incrementProcessInterval("days")
                      else if (data.processSchedule.frequencyType === "Every X Minutes")
                        incrementProcessInterval("minutes")
                      else incrementProcessInterval("hours")
                    }}
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {data.processSchedule.frequencyType === "Monthly" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="processDayOfMonth">Day of Month</Label>
                  <Input
                    id="processDayOfMonth"
                    type="number"
                    value={data.processSchedule.dayOfMonth || ""}
                    onChange={(e) =>
                      updateProcessSchedule({ dayOfMonth: Number.parseInt(e.target.value) || undefined })
                    }
                    className="w-full"
                    min="1"
                    max="31"
                  />
                  {data.processSchedule.dayOfMonth !== undefined &&
                    validateDayOfMonth(data.processSchedule.dayOfMonth) && (
                      <p className="text-sm text-red-500">{validateDayOfMonth(data.processSchedule.dayOfMonth)}</p>
                    )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="processStartTime">Start time</Label>
                  <Input
                    id="processStartTime"
                    type="time"
                    value={data.processSchedule.startTime || ""}
                    onChange={(e) => updateProcessSchedule({ startTime: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {data.processSchedule.frequencyType === "Specific" && (
              <div className="space-y-2">
                <Label htmlFor="processSpecificTime">Start time</Label>
                <Input
                  id="processSpecificTime"
                  type="time"
                  value={data.processSchedule.startTime || ""}
                  onChange={(e) => updateProcessSchedule({ startTime: e.target.value })}
                  className="w-32"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
