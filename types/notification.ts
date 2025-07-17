import type { LucideIcon } from "lucide-react"

export type NotificationCategory =
  | "flux_creation"
  | "flux_error"
  | "flux_processing"
  | "mapping_update"
  | "system_alert"

export interface Notification {
  id: string
  category: NotificationCategory
  title: string
  description?: string // Optional detailed description
  timestamp: string // ISO 8601 date string
  isRead: boolean
  icon: LucideIcon | string // Can be a LucideIcon component or a path to an SVG
  iconColor?: string // Tailwind color class for the icon e.g., "text-green-500"
  link?: string // Optional link to navigate to
}
