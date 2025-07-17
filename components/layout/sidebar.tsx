"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ListChecks,
  FileTextIcon,
  FileText,
  Settings,
  PlusCircle,
  Users,
  BarChart3,
  ShieldCheck,
  LifeBuoy,
  Workflow,
  MenuIcon,
  History,
  Clock,
  Bell,
  ChevronDown,
  Map,
  Upload,
  DollarSign,
  Database,
  Layers,
  Languages,
  Bot,
  Network,
  Terminal,
  HeartPulse,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useBlade } from "@/lib/blade-context"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  SidebarTooltipProvider,
  SidebarTooltip,
  SidebarTooltipTrigger,
  SidebarTooltipContent,
} from "@/components/ui/sidebar-tooltip"
import StatusBar from "@/components/system-health/status-bar" // Ensure this path is correct

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  isCollapsed: boolean
  setIsCollapsed: (isCollapsed: boolean) => void
}

const fluxMainItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/list-of-fluxs", icon: Workflow, label: "Flux List" },
]

const historyItems = [
  { href: "/flux-list/workflow-execution-log", icon: FileTextIcon, label: "Workflow Execution" },
  { href: "/flux-list/fetching-history", icon: History, label: "Fetching history" },
  { href: "/flux-list/processing-history", icon: Clock, label: "Processing history" },
  { href: "/normalization-history", icon: History, label: "Normalization history" },
  { href: "/refinement-history", icon: History, label: "Refinement history" },
  { href: "/calculation-history", icon: History, label: "Calculation history" },
]

const fluxAfterHistoryItems = [
  { href: "/flux-list/processing-history/fetched-content", icon: FileText, label: "Fetched content" },
  { href: "/error-logs", icon: FileTextIcon, label: "Error logs" },
  { href: "/recent-activity", icon: Bell, label: "Recent activity" },
]

const workingPagesItems = [
  { href: "/dashboard-2", icon: LayoutDashboard, label: "Dashboard-2" },
  { href: "/flux-list", icon: ListChecks, label: "Flux List 2" },
  { href: "/financial-workflow", icon: Workflow, label: "Financial Workflow" },
]

const otherItems = [
  { href: "/system-health", icon: HeartPulse, label: "System Health" },
  { href: "#", icon: Settings, label: "Settings" },
  { href: "#", icon: Users, label: "User Management" },
  { href: "#", icon: BarChart3, label: "Analytics" },
  { href: "#", icon: ShieldCheck, label: "Security" },
  { href: "#", icon: LifeBuoy, label: "Help & Support" },
]

const collapsedNavItems = [
  ...fluxMainItems,
  ...historyItems,
  ...fluxAfterHistoryItems,
  ...workingPagesItems,
  ...otherItems,
]

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuth() // logout function is still available from context if needed elsewhere
  const { openBlade } = useBlade()

  const [fluxOpen, setFluxOpen] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [workingOpen, setWorkingOpen] = useState(false)
  const [showShadow, setShowShadow] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const fm = localStorage.getItem("sidebar_flux_open")
      const hm = localStorage.getItem("sidebar_history_open")
      const wp = localStorage.getItem("sidebar_working_open")
      if (fm !== null) setFluxOpen(fm === "true")
      if (hm !== null) setHistoryOpen(hm === "true")
      if (wp !== null) setWorkingOpen(wp === "true")
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_flux_open", String(fluxOpen))
    }
  }, [fluxOpen])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_history_open", String(historyOpen))
    }
  }, [historyOpen])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_working_open", String(workingOpen))
    }
  }, [workingOpen])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const handleScroll = () => {
      setShowShadow(nav.scrollTop > 0)
    }
    nav.addEventListener("scroll", handleScroll)
    return () => nav.removeEventListener("scroll", handleScroll)
  }, [])

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
    if (!isCollapsed) {
      setIsOpen(true)
    }
  }

  const handleOpenNewFlux = () => {
    openBlade(null)
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768 && isOpen) {
        // setIsOpen(false); // This might be too aggressive, consider user intent
      }
    }
  }, [pathname, isOpen, setIsOpen])

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && !isCollapsed && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64",
          isOpen || isCollapsed ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-sidebar-border",
            isCollapsed ? "h-16 justify-center" : "h-16 px-6",
          )}
        >
          <button
            onClick={handleToggleCollapse}
            className={cn(
              "hidden lg:block p-2 rounded-md hover:bg-sidebar-hover focus:outline-none focus:ring-2 focus:ring-sidebar-ring", // Koristi sidebar-ring
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 ml-2">
              <Image src="/logo.svg" alt="HillMetrics Logo" width={140} height={25} priority />
            </Link>
          )}
        </div>

        <nav ref={navRef} className="flex-1 overflow-y-auto px-3 pb-4 pt-0 gmail-scrollbar bg-sidebar">
          <div className={cn("sticky top-0 z-20 bg-sidebar pb-3 pt-6", showShadow && "sidebar-shadow")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    "bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary-focus-ring",
                    isCollapsed ? "justify-center" : "",
                  )}
                >
                  <PlusCircle className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>Create New</span>}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={0}
                className="origin-top-left rounded-md p-2 shadow-lg bg-popover"
              >
                <DropdownMenuLabel className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  ⚙️ Flux management
                </DropdownMenuLabel>
                <DropdownMenuItem onSelect={handleOpenNewFlux} className="cursor-pointer">
                  <Workflow className="mr-2 h-4 w-4" /> Flux
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="#" className="flex items-center w-full">
                    <Map className="mr-2 h-4 w-4" /> Property Mapping
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="#" className="flex items-center w-full">
                    <Upload className="mr-2 h-4 w-4" /> File Upload and Data Mapping
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="#" className="flex items-center w-full">
                    <DollarSign className="mr-2 h-4 w-4" /> Financial Data Point
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="#" className="flex items-center w-full">
                    <Database className="mr-2 h-4 w-4" /> Source
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="#" className="flex items-center w-full">
                    <FileText className="mr-2 h-4 w-4" /> Document Type
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="#" className="flex items-center w-full">
                    <Layers className="mr-2 h-4 w-4" /> GICS Classification
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="#" className="flex items-center w-full">
                    <Languages className="mr-2 h-4 w-4" /> Language
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  🤖 AI
                </DropdownMenuLabel>
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="#" className="flex items-center w-full">
                    <Bot className="mr-2 h-4 w-4" /> LLM Model
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="#" className="flex items-center w-full">
                    <Network className="mr-2 h-4 w-4" /> AI Endpoint
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="#" className="flex items-center w-full">
                    <Terminal className="mr-2 h-4 w-4" /> AI Prompt
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  🗂️ Other
                </DropdownMenuLabel>
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="#" className="flex items-center w-full">
                    <Users className="mr-2 h-4 w-4" /> Clients
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="pt-3 space-y-1">
            {isCollapsed ? (
              <SidebarTooltipProvider>
                {collapsedNavItems.map((item) => (
                  <SidebarTooltip key={item.label}>
                    <SidebarTooltipTrigger asChild>
                      <Link
                        href={item.href}
                        aria-describedby={`${item.label}-tooltip`}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                          pathname === item.href && item.href !== "#"
                            ? "bg-sidebar-active text-sidebar-active-foreground font-medium"
                            : "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground",
                          "justify-center",
                        )}
                        onClick={() => {
                          if (window.innerWidth < 1024) setIsOpen(false)
                        }}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                      </Link>
                    </SidebarTooltipTrigger>
                    <SidebarTooltipContent id={`${item.label}-tooltip`}>{item.label}</SidebarTooltipContent>
                  </SidebarTooltip>
                ))}
              </SidebarTooltipProvider>
            ) : (
              <>
                <div>
                  <button
                    onClick={() => setFluxOpen(!fluxOpen)}
                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    <span>Flux management</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", fluxOpen ? "rotate-0" : "-rotate-90")} />
                  </button>
                  <div
                    className={cn(
                      "space-y-1 pl-2 transition-all duration-150",
                      fluxOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden",
                    )}
                  >
                    {fluxMainItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                          pathname === item.href && item.href !== "#"
                            ? "bg-sidebar-active text-sidebar-active-foreground font-medium"
                            : "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground",
                        )}
                        onClick={() => {
                          if (window.innerWidth < 1024) setIsOpen(false)
                        }}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    ))}

                    <div>
                      <button
                        onClick={() => setHistoryOpen(!historyOpen)}
                        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                      >
                        <span>History</span>
                        <ChevronDown
                          className={cn("h-4 w-4 transition-transform", historyOpen ? "rotate-0" : "-rotate-90")}
                        />
                      </button>
                      <div
                        className={cn(
                          "space-y-1 pl-2 transition-all duration-150",
                          historyOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden",
                        )}
                      >
                        {historyItems.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                              pathname === item.href && item.href !== "#"
                                ? "bg-sidebar-active text-sidebar-active-foreground font-medium"
                                : "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground",
                            )}
                            onClick={() => {
                              if (window.innerWidth < 1024) setIsOpen(false)
                            }}
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {fluxAfterHistoryItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                          pathname === item.href && item.href !== "#"
                            ? "bg-sidebar-active text-sidebar-active-foreground font-medium"
                            : "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground",
                        )}
                        onClick={() => {
                          if (window.innerWidth < 1024) setIsOpen(false)
                        }}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => setWorkingOpen(!workingOpen)}
                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    <span>Working pages</span>
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", workingOpen ? "rotate-0" : "-rotate-90")}
                    />
                  </button>
                  <div
                    className={cn(
                      "space-y-1 pl-2 transition-all duration-150",
                      workingOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden",
                    )}
                  >
                    {workingPagesItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                          pathname === item.href && item.href !== "#"
                            ? "bg-sidebar-active text-sidebar-active-foreground font-medium"
                            : "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground",
                        )}
                        onClick={() => {
                          if (window.innerWidth < 1024) setIsOpen(false)
                        }}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                {otherItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                      pathname === item.href && item.href !== "#"
                        ? "bg-sidebar-active text-sidebar-active-foreground font-medium"
                        : "hover:bg-sidebar-hover hover:text-sidebar-hover-foreground",
                    )}
                    onClick={() => {
                      if (window.innerWidth < 1024) setIsOpen(false)
                    }}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </nav>

        <div className="mt-auto border-t border-sidebar-border px-3 py-4">
          {/* System Health Section with StatusBar */}
          <StatusBar isCollapsed={isCollapsed} />
        </div>
      </aside>
    </>
  )
}
