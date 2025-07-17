import type { ServiceHealth, ComponentStatusValue } from "@/types/system-health"
import ComponentStatusItem from "./component-status-item"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ServiceStatusPopoverProps {
  service: ServiceHealth
}

const getOverallStatusColor = (status: ComponentStatusValue) => {
  switch (status) {
    case "up":
      return "text-green-500"
    case "down":
      return "text-red-500"
    case "degraded":
      return "text-yellow-500"
    default:
      return "text-gray-500"
  }
}

export default function ServiceStatusPopover({ service }: ServiceStatusPopoverProps) {
  return (
    <div className="p-3 w-64">
      {" "}
      {/* Adjusted width to be compact */}
      <h4 className="text-base font-semibold text-sidebar-foreground mb-2">{service.type} Status</h4>
      <div className="flex items-center justify-between text-sm mb-3">
        <span className={cn("font-medium", getOverallStatusColor(service.overallStatus))}>
          {service.overallStatus.toUpperCase()}
        </span>
        <span className="text-sidebar-foreground/80">{service.overallUptime}</span>
      </div>
      <div className="space-y-1 border-t border-sidebar-border pt-3">
        {service.components.map((component) => (
          <ComponentStatusItem key={component.name} component={component} />
        ))}
      </div>
      <Link href="#" className="text-xs text-blue-400 hover:underline mt-3 block">
        See details and history
      </Link>
    </div>
  )
}
