"use client"

import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, Check, XCircle, Info, CheckCircle, AlertTriangle } from "lucide-react" // Added Info, CheckCircle, AlertTriangle
import { formatDistanceToNow, parseISO } from "date-fns"
import type { Notification } from "@/types/notification"
// Assuming CustomCloseIcon is not directly used here, but if it is, ensure it's also light-theme compatible.

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onTurnOffNotifications: (category: Notification["category"]) => void
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onTurnOffNotifications,
}: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(parseISO(notification.timestamp), { addSuffix: true })

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 border-b border-gray-200 last:border-b-0",
        "hover:bg-gray-50", // Removed dark:hover:bg-gray-700
        notification.isRead ? "bg-gray-50 text-gray-500" : "bg-white text-gray-900", // Removed dark:bg-gray-900, dark:bg-gray-800, dark:text-gray-50
      )}
    >
      <div className="flex-shrink-0 pt-1">
        {/* Icon based on notification type */}
        {notification.type === "alert" && <XCircle className="h-5 w-5 text-red-500" />}
        {notification.type === "info" && <Info className="h-5 w-5 text-blue-500" />}
        {notification.type === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
        {notification.type === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
        {/* Add other icons as needed */}
      </div>
      <div className="flex-1">
        <p className={cn("text-sm font-medium", notification.isRead && "text-gray-500")}>
          {" "}
          {/* Removed dark:text-gray-400 */}
          {notification.title}
        </p>
        <p className={cn("text-xs text-gray-600", notification.isRead && "text-gray-500")}>
          {" "}
          {/* Removed dark:text-gray-400 */}
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>
      <div className="flex-shrink-0 flex gap-1">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-500 hover:bg-gray-200" // Removed dark:text-gray-400 dark:hover:bg-gray-700
            onClick={() => onMarkAsRead(notification.id)}
            aria-label="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:bg-gray-200">
              {" "}
              {/* Removed dark:text-gray-400 dark:hover:bg-gray-700 */}
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {" "}
            {/* Removed dark:bg-gray-800 dark:border-gray-700 */}
            <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>Mark as read</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTurnOffNotifications(notification.category)}>
              Turn off {notification.category} notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
