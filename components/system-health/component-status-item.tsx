import { cn } from "@/lib/utils"
import type { ComponentStatus, ComponentStatusValue } from "@/types/system-health"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface ComponentStatusItemProps {
  component: ComponentStatus
}

const getStatusIcon = (status: ComponentStatusValue) => {
  switch (status) {
    case "up":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "down":
      return <XCircle className="h-4 w-4 text-red-500" />
    case "degraded":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    default:
      return null
  }
}

const getHistoryColor = (status: ComponentStatusValue) => {
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

export default function ComponentStatusItem({ component }: ComponentStatusItemProps) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <div className="flex items-center gap-2">
        {getStatusIcon(component.status)}
        <span className="text-sidebar-foreground">{component.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {component.history.map((status, index) => (
            <div key={index} className={cn("h-2 w-2 rounded-full", getHistoryColor(status))} title={status} />
          ))}
        </div>
        <span className="text-xs text-sidebar-foreground/80">{component.uptime}</span>
      </div>
    </div>
  )
}
