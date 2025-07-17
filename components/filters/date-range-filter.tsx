"use client"

import type * as React from "react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangeFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: {
    preset?: string
    range?: DateRange
  }
  onValueChange: (value: { preset: string; range?: DateRange }) => void
}

export function DateRangeFilter({ className, value, onValueChange }: DateRangeFilterProps) {
  const handleSelect = (range: DateRange | undefined) => {
    onValueChange({ preset: "custom", range })
  }

  const displayValue =
    value?.range?.from && value.range.to
      ? `${format(value.range.from, "LLL dd, y")} - ${format(value.range.to, "LLL dd, y")}`
      : value?.range?.from
        ? format(value.range.from, "LLL dd, y")
        : "Select date range..."

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-auto justify-start text-left font-normal", !value?.range && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{displayValue}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[10001]" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.range?.from}
            selected={value?.range}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
