import {
  CheckCircle,
  XCircle,
  PauseCircle,
  Clock,
  AlertTriangle,
  CircleDot,
  Ban,
  Building,
  Trash2,
  RefreshCw,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface StatusIconConfig {
  icon: LucideIcon
  colorClass: string
  label: string // Full label for tooltip
}

export const commonStatusMap: Record<string, StatusIconConfig> = {
  // Financial Workflow statuses (and common statuses that might appear in Flux List)
  active: { icon: CircleDot, colorClass: "text-green-400", label: "Active" }, // Svetlo zelena
  completed: { icon: CheckCircle, colorClass: "text-green-500", label: "Completed" },
  failed: { icon: XCircle, colorClass: "text-red-500", label: "Failed" },
  Failed: { icon: XCircle, colorClass: "text-red-500", label: "Failed" },
  Created: { icon: Clock, colorClass: "text-gray-500", label: "Created" },
  InProgress: { icon: RefreshCw, colorClass: "text-blue-500 animate-spin", label: "In Progress" },
  default: { icon: CircleDot, colorClass: "text-gray-500", label: "Unknown" },

  // Flux List categories (status)
  Active: { icon: CircleDot, colorClass: "text-green-400", label: "Active" }, // Svetlo zelena
  Disabled: { icon: Ban, colorClass: "text-gray-500", label: "Disabled" },
  "Back office only": { icon: Building, colorClass: "text-yellow-600", label: "Back office only" },
  Obsolete: { icon: Trash2, colorClass: "text-gray-500", label: "Obsolete" },

  // Flux List stages (and other common statuses that might appear)
  "Processing in progress": { icon: Clock, colorClass: "text-green-700", label: "Processing in progress" }, // Tamno zelena
  "Fetching in progress": { icon: Clock, colorClass: "text-cyan-600", label: "Fetching in progress" },
  "Currently processing": {
    icon: RefreshCw,
    colorClass: "text-orange-500 animate-spin",
    label: "Currently processing",
  },
  "Currently fetching": {
    icon: RefreshCw,
    colorClass: "text-blue-500 animate-spin",
    label: "Currently fetching",
  },
  "In progress": {
    icon: RefreshCw,
    colorClass: "text-blue-500 animate-spin",
    label: "In progress",
  },
  "In Progress": {
    icon: RefreshCw,
    colorClass: "text-blue-500 animate-spin",
    label: "In Progress",
  },
  "Validating in progress": { icon: Clock, colorClass: "text-purple-600", label: "Validating in progress" },
  "Analyzing in progress": { icon: Clock, colorClass: "text-indigo-600", label: "Analyzing in progress" },
  "Pending in progress": { icon: Clock, colorClass: "text-yellow-600", label: "Pending in progress" },
  Success: { icon: CheckCircle, colorClass: "text-green-500", label: "Success" },
  Finished: { icon: CheckCircle, colorClass: "text-green-700", label: "Finished" },
  Done: { icon: CheckCircle, colorClass: "text-green-700", label: "Done" },
  Error: { icon: XCircle, colorClass: "text-red-600", label: "Error" },
  Timeout: { icon: XCircle, colorClass: "text-red-600", label: "Timeout" },
  Cancelled: { icon: Ban, colorClass: "text-gray-500", label: "Cancelled" },
  Rejected: { icon: XCircle, colorClass: "text-red-600", label: "Rejected" },
  Paused: { icon: PauseCircle, colorClass: "text-gray-900", label: "Paused" }, // Crna (ili text-black ako preferirate)
  Partially: { icon: AlertTriangle, colorClass: "text-red-800", label: "Partially" }, // Tamno crvena
  Processing: { icon: Clock, colorClass: "text-green-500", label: "Processing" }, // Zelena
}

// Helper function to get status config with className for Badge components
export const getStatusBadgeConfig = (status: string) => {
  const config = commonStatusMap[status] || commonStatusMap.default
  return {
    ...config,
    className: getStatusBadgeClassName(status)
  }
}

// Helper function to get className for status badges
export const getStatusBadgeClassName = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'success':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'failed':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'inprogress':
    case 'in progress':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'created':
      return 'text-gray-600 bg-gray-50 border-gray-200'
    case 'active':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'completed':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'processing':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}
