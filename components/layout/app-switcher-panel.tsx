"use client"

import Link from "next/link"
import {
  KeyRound,
  Cloud,
  BarChart3,
  Globe,
  Database,
  type LucideIcon,
  LayoutDashboard,
  FileText,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AppItem {
  name: string
  href: string
  icon: LucideIcon
  iconColor?: string
}

const appItems: AppItem[] = [
  { name: "Keycloak", href: "#", icon: KeyRound, iconColor: "text-blue-600" },
  { name: "Azure", href: "#", icon: Cloud, iconColor: "text-sky-500" },
  { name: "Grafana", href: "#", icon: BarChart3, iconColor: "text-orange-500" },
  { name: "Content Mng.", href: "#", icon: FileText, iconColor: "text-indigo-500" },
  { name: "Web app", href: "#", icon: Globe, iconColor: "text-green-500" },
  { name: "HM Data", href: "#", icon: Database, iconColor: "text-gray-700" },
  { name: "Dashboard-2", href: "/dashboard-2", icon: LayoutDashboard, iconColor: "text-teal-500" },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, iconColor: "text-teal-500" },
  { name: "Flux List", href: "/flux-list", icon: FileText, iconColor: "text-purple-500" },
  { name: "User Admin", href: "#", icon: Users, iconColor: "text-pink-500" },
]

interface AppSwitcherPanelProps {
  onClose: () => void
}

export default function AppSwitcherPanel({ onClose }: AppSwitcherPanelProps) {
  return (
    <div className="w-[320px] p-4 bg-white rounded-lg shadow-xl">
      <div className="grid grid-cols-3 gap-4">
        {appItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClose}
            className="flex flex-col items-center justify-center p-3 space-y-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#5499a2] focus:ring-offset-1"
            aria-label={item.name}
          >
            <item.icon className={cn("h-8 w-8", item.iconColor || "text-gray-600")} />
            <span className="text-xs text-center text-gray-700">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
