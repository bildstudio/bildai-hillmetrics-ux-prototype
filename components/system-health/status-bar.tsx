"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { mockSystemHealthData } from "@/lib/mock-system-health-data"
import ServiceStatusPopover from "./service-status-popover"
import type { ServiceHealth, ComponentStatusValue } from "@/types/system-health"

const getSegmentColor = (status: ComponentStatusValue) => {
  switch (status) {
    case "up":
      return "bg-green-500"
    case "down":
      return "bg-red-500"
    case "degraded":
      return "bg-yellow-500"
    default:
      return "bg-gray-400"
  }
}

export default function StatusBar({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className={cn("w-full", isCollapsed ? "px-0" : "px-3")}>
      {!isCollapsed && <div className="text-xs uppercase text-slate-400 tracking-wider mb-2">System health</div>}
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-700">
        {mockSystemHealthData.map((service: ServiceHealth, index: number) => (
          <Popover key={service.type} openDelay={100} closeDelay={100}>
            <PopoverTrigger asChild>
              <div
                className={cn(
                  "flex-1 h-full transition-all duration-200 cursor-pointer hover:brightness-125", // Added hover effect
                  getSegmentColor(service.overallStatus),
                  // Conditionally apply border-r for the first three segments
                  index < 3 && "border-r border-[#021417]", // Added border-r and custom color
                )}
                title={`${service.type}: ${service.overallStatus.toUpperCase()}`}
              />
            </PopoverTrigger>
            <PopoverContent
              className="p-0 border-none shadow-lg bg-sidebar-active text-sidebar-foreground"
              side="right"
              align="start"
            >
              <ServiceStatusPopover service={service} />
            </PopoverContent>
          </Popover>
        ))}
      </div>
    </div>
  )
}
