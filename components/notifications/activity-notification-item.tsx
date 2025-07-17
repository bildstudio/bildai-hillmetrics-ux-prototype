"use client"

import { useState } from "react"
import { Check, MoreVertical } from "lucide-react"
import { ActivityItem } from "@/components/activity/activity-item"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { ActivityEvent } from "@/app/actions/activity"

export interface ActivityNotification extends ActivityEvent {
  isRead: boolean
}

interface ActivityNotificationItemProps {
  item: ActivityNotification
  onMarkAsRead: (id: string) => void
  onTurnOffNotifications: (category: ActivityEvent["type"]) => void
  onNavigateToFetchedContents?: (fetchingID: number) => void
  onNavigateToFetchedContentsFromProcessing?: (processingID: number) => void
  onViewFetchingDetails?: (fetchingID: number) => void
  onViewProcessingDetails?: (processingID: number) => void
  onViewWorkflowDetails?: (workflowId: number) => void
  onViewNormalizationDetails?: (normalizationID: number) => void
  onViewRefinementDetails?: (refinementID: number) => void
  onViewCalculationDetails?: (calculationID: number) => void
}

export function ActivityNotificationItem({
  item,
  onMarkAsRead,
  onTurnOffNotifications,
  onNavigateToFetchedContents,
  onNavigateToFetchedContentsFromProcessing,
  onViewFetchingDetails,
  onViewProcessingDetails,
  onViewWorkflowDetails,
  onViewNormalizationDetails,
  onViewRefinementDetails,
  onViewCalculationDetails,
}: ActivityNotificationItemProps) {

  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        "relative p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50",
        item.isRead ? "bg-gray-50 text-gray-500" : "bg-white text-gray-900",
      )}
    >
      <div className={cn(!expanded && "max-h-24 overflow-hidden")}>
        <ActivityItem
          activity={item}
          className="px-0"
          onNavigateToFetchedContents={onNavigateToFetchedContents}
          onNavigateToFetchedContentsFromProcessing={onNavigateToFetchedContentsFromProcessing}
          onViewFetchingDetails={onViewFetchingDetails}
          onViewProcessingDetails={onViewProcessingDetails}
          onViewWorkflowDetails={onViewWorkflowDetails}
          onViewNormalizationDetails={onViewNormalizationDetails}
          onViewRefinementDetails={onViewRefinementDetails}
          onViewCalculationDetails={onViewCalculationDetails}
        />
      </div>
      <div className="mt-2 text-right space-x-2">
        {!expanded ? (
          <Button variant="link" className="text-xs p-0" onClick={() => setExpanded(true)}>
            Show more
          </Button>
        ) : (
          <Button variant="link" className="text-xs p-0" onClick={() => setExpanded(false)}>
            Hide
          </Button>
        )}
      </div>
      {!item.isRead && (
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-500 hover:bg-gray-200"
            onClick={() => onMarkAsRead(item.id)}
            aria-label="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="absolute top-2 right-9">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:bg-gray-200">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onMarkAsRead(item.id)}>Mark as read</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTurnOffNotifications(item.type)}>
              Turn off {item.type} notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
