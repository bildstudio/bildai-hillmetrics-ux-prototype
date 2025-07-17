"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import {
  X,
  MoreVertical,
  Copy,
  Download,
  Zap,
  History,
  Clock,
  Bug,
  Minus,
  ChevronDown,
  Globe,
  Eye,
  FileText,
  Pen,
  TextCursorInput,
  Trash,
  Bell,
  DollarSign,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FluxMenuItems, type FluxMenuAction } from "@/components/flux-list/menu-items"
import type { FluxData } from "@/lib/data-store"
import { useViewBlade } from "@/lib/view-blade-context"
import { useEditBlade } from "@/lib/edit-blade-context"
import { useBladeStack } from "@/lib/blade-stack-context"
import { BaseBlade } from "@/components/blade/base-blade"
import { FetchingHistoryGrid } from "@/components/fetching-history/fetching-history-grid"
import { ProcessingHistoryGrid } from "@/components/processing-history/processing-history-grid"
import { FetchedContentsGrid } from "@/components/fetched-contents/fetched-contents-grid"
import { ActivityFeed } from "@/components/activity/activity-feed"
import { WorkflowExecutionLogGrid } from "@/components/workflow-execution-log/workflow-execution-log-grid"
import type { WorkflowExecutionLogData } from "@/app/actions/workflow-execution-log"
import ProcessingHistoryDetailsBlade from "../processing-history/processing-history-details-blade"
import FetchingHistoryDetailsBlade from "../fetching-history/fetching-history-details-blade"
import NormalizationDetailsBlade from "../normalization-history/NormalizationDetailsBlade"
import RefinementDetailsBlade from "../refinement-history/RefinementDetailsBlade"
import CalculationDetailsBlade from "../calculation-history/CalculationDetailsBlade"
import SummaryOverview from "./SummaryOverview"
import FluxDetails from "./FluxDetails"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useTestNotification, type NotificationAction } from "@/lib/test-notification-context"
import { updateReportById } from "@/app/actions/reports"

const TABS = [
  { id: "summary", label: "Summary", icon: Globe },
  { id: "activity", label: "Activity", icon: Bell },
  { id: "flux-details", label: "Flux details", icon: Eye },
  { id: "history", label: "History", icon: History },
  { id: "fetched-contents", label: "Fetched contents", icon: FileText },
  { id: "error-logs", label: "Error logs", icon: Bug },
  { id: "financial-data-points", label: "Financial Data Points", icon: DollarSign },
]

const HISTORY_TABS = [
  { id: "workflow-execution-history", label: "Workflow execution" },
  { id: "fetching-history", label: "Fetching" },
  { id: "processing-history", label: "Processing" },
  { id: "normalization-history", label: "Normalization" },
  { id: "refinement-history", label: "Refinement" },
  { id: "calculation-history", label: "Calculation" },
]


const HISTORY_SUBTABS = [
  { id: "workflow-execution-history", label: "Workflow execution" },
  { id: "fetching-history", label: "Fetching" },
  { id: "processing-history", label: "Processing" },
  { id: "normalization-history", label: "Normalization" },
  { id: "refinement-history", label: "Refinement" },
  { id: "calculation-history", label: "Calculation" },
]

const HISTORY_SUBTAB_LIST = [
  { id: "workflow-execution-history", label: "Workflow execution" },
  { id: "fetching-history", label: "Fetching" },
  { id: "processing-history", label: "Processing" },
  { id: "normalization-history", label: "Normalization" },
  { id: "refinement-history", label: "Refinement" },
  { id: "calculation-history", label: "Calculation" },
]

const ResponsiveTabs = ({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tabId: string) => void
}) => {
  const [visibleTabs, setVisibleTabs] = useState(TABS)
  const [hiddenTabs, setHiddenTabs] = useState<typeof TABS>([])
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const measurementRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const calculateTabs = () => {
      const container = tabsContainerRef.current
      if (!container) return

      const containerWidth = container.offsetWidth
      const moreButtonWidth = 120
      let totalWidth = 0
      let visibleCount = 0

      for (let i = 0; i < TABS.length; i++) {
        const measurementEl = measurementRefs.current[i]
        if (!measurementEl) continue

        const tabWidth = measurementEl.offsetWidth + 8

        if (
          totalWidth + tabWidth >
          containerWidth - (hiddenTabs.length > 0 || i < TABS.length - 1 ? moreButtonWidth : 0)
        ) {
          break
        }

        totalWidth += tabWidth
        visibleCount++
      }

      if (visibleCount === 0) visibleCount = 1

      const newVisibleTabs = TABS.slice(0, visibleCount)
      const newHiddenTabs = TABS.slice(visibleCount)

      setVisibleTabs(newVisibleTabs)
      setHiddenTabs(newHiddenTabs)
    }

    const timeoutId = setTimeout(calculateTabs, 100)

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(calculateTabs, 100)
    })

    if (tabsContainerRef.current) {
      resizeObserver.observe(tabsContainerRef.current)
    }

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
    }
  }, [])

  const handleDropdownSelect = (tabId: string) => {
    onTabChange(tabId)
    setIsMoreOpen(false)
  }

  return (
    <>
      <TabsList
        ref={tabsContainerRef}
        className="relative flex items-center justify-start bg-transparent p-0 h-auto w-full overflow-hidden"
      >
        {visibleTabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
        {hiddenTabs.length > 0 && (
          <DropdownMenu open={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1 ml-auto px-4 flex-shrink-0">
                More ({hiddenTabs.length}) <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" forceMount className="z-[10001]" style={{ zIndex: 10001 }}>
              {hiddenTabs.map((tab) => (
                <DropdownMenuItem key={tab.id} onSelect={() => handleDropdownSelect(tab.id)}>
                  <tab.icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TabsList>
      <div className="absolute top-0 left-0 opacity-0 pointer-events-none -z-10">
        <div className="flex">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => {
                measurementRefs.current[index] = el
              }}
              className="flex items-center gap-2 whitespace-nowrap px-4 py-3 font-medium"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default function ViewFluxBlade({ reportId, onReady }: { reportId: string; onReady?: () => void }) {
  const { getBlade, closeBlade, minimizeBlade, updateBladeState } = useViewBlade()
  const { openBlade: openEditBladeCtx, getBlade: getEditBlade } = useEditBlade()
  const { openBlade, closeTopBlade, minimizeStack, stackCount } = useBladeStack()
  const bladeState = getBlade(reportId)
  const editBladeState = getEditBlade(reportId)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [reportName, setReportName] = useState("View Report")
  const [activeTab, setActiveTab] = useState("summary")
  const [activeHistoryTab, setActiveHistoryTab] = useState(
    "workflow-execution-history",
  )
  const [selectedFetchingId, setSelectedFetchingId] = useState<number | null>(null)
  const [selectedProcessingId, setSelectedProcessingId] = useState<number | null>(null)
  const [selectedFetchingIdForContent, setSelectedFetchingIdForContent] = useState<number | null>(null)
  const [selectedProcessingIdForHistory, setSelectedProcessingIdForHistory] = useState<number | null>(null)
  const openStackBlade = openBlade
  const [processingDetail, setProcessingDetail] = useState<{ id: number; name: string; fluxId: string } | null>(null)
  const [fetchingDetail, setFetchingDetail] = useState<{ id: number; name: string } | null>(null)
  const [normalizationDetail, setNormalizationDetail] = useState<{ id: number; name: string; fluxId: string } | null>(null)
  const [refinementDetail, setRefinementDetail] = useState<{ id: number; name: string; fluxId: string } | null>(null)
  const [calculationDetail, setCalculationDetail] = useState<{ id: number; name: string; fluxId: string } | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [durationBucketFilter, setDurationBucketFilter] = useState<string | null>(null)
  const [errorTypeFilter, setErrorTypeFilter] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string | null>(null)

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [renameValue, setRenameValue] = useState("")

  const [isNestedPreviewOpen, setIsNestedPreviewOpen] = useState(false)

  const headerHeight = "h-16"

  useEffect(() => {
    onReady?.()
    // run once on mount
  }, [])

  const fluxName = bladeState?.name || reportName

  const openEditBlade = useCallback(() => {
    openEditBladeCtx(reportId, fluxName, { zIndex: 10020, stackControlled: true })
    openBlade(() => import("@/components/edit-flux-blade/EditFluxBlade"), { reportId }, fluxName)
  }, [reportId, fluxName, openEditBladeCtx, openBlade])

  const handlePreviewFile = useCallback(
    (file: { id: string; name: string; fluxId: string; fluxName?: string }) => {
      openStackBlade(
        () => import("./FilePreviewBlade"),
        {
          file,
          onClose: closeTopBlade,
        },
        file.name,
      )
    },
    [openStackBlade, closeTopBlade],
  )

  const handleViewProcessingDetails = useCallback(
    async (id: number) => {
      try {
        // Fetch the processing data to get the actual flux ID
        const response = await fetch(`/api/processing-history/by-id?processingId=${id}`)
        const result = await response.json()
        
        if (result.error || !result.data) {
          console.error("Failed to fetch processing data:", result.error)
          // Fallback to current reportId if API fails
          setProcessingDetail({ id, name: fluxName, fluxId: reportId })
          return
        }
        
        const actualFluxId = String(result.data.fluxID)
        console.log("🔍 Got actual flux ID for processing", id, ":", actualFluxId)
        setProcessingDetail({ id, name: fluxName, fluxId: actualFluxId })
      } catch (error) {
        console.error("Error fetching processing details:", error)
        // Fallback to current reportId if fetch fails
        setProcessingDetail({ id, name: fluxName, fluxId: reportId })
      }
    },
    [fluxName, reportId],
  )

  const handleCloseProcessingDetails = useCallback(() => {
    setProcessingDetail(null)
  }, [])

  const handleViewFetchingDetails = useCallback(
    (id: number) => {
      setFetchingDetail({ id, name: fluxName })
    },
    [fluxName],
  )

  const handleCloseFetchingDetails = useCallback(() => {
    setFetchingDetail(null)
  }, [])

  const handleViewNormalizationDetails = useCallback(
    (id: number) => {
      setNormalizationDetail({ id, name: fluxName, fluxId: reportId })
    },
    [fluxName, reportId],
  )

  const handleCloseNormalizationDetails = useCallback(() => {
    setNormalizationDetail(null)
  }, [])

  const handleViewRefinementDetails = useCallback(
    (id: number) => {
      setRefinementDetail({ id, name: fluxName, fluxId: reportId })
    },
    [fluxName, reportId],
  )

  const handleCloseRefinementDetails = useCallback(() => {
    setRefinementDetail(null)
  }, [])

  const handleViewCalculationDetails = useCallback(
    (id: number) => {
      setCalculationDetail({ id, name: fluxName, fluxId: reportId })
    },
    [fluxName, reportId],
  )

  const handleCloseCalculationDetails = useCallback(() => {
    setCalculationDetail(null)
  }, [])

  const openFetchingDetailsBlade = useCallback(
    (
      id: number,
      fluxId?: number,
      name?: string,
    ) => {
      openBlade(
        () => import("@/components/fetching-history/fetching-history-details-blade"),
        {
          fetchingId: id,
          fluxId: String(fluxId ?? reportId),
          fluxName: name ?? fluxName,
          onClose: closeTopBlade,
          onFluxDetails: () => setActiveTab("flux-details"),
        },
        name ?? fluxName,
      )
    },
    [openBlade, closeTopBlade, reportId, fluxName],
  )

  const openProcessingDetailsBlade = useCallback(
    (
      id: number,
      fluxId?: number,
      name?: string,
    ) => {
      openBlade(
        () => import("@/components/processing-history/processing-history-details-blade"),
        {
          processingId: id,
          fluxId: String(fluxId ?? reportId),
          fluxName: name ?? fluxName,
          onClose: closeTopBlade,
          onFluxDetails: () => setActiveTab("flux-details"),
        },
        name ?? fluxName,
      )
    },
    [openBlade, closeTopBlade, reportId, fluxName],
  )

  const handleContentClick = (fetchingID: number) => {
    setSelectedFetchingIdForContent(fetchingID)
    setSelectedProcessingId(null)
    setSelectedFetchingId(null)
    setSelectedProcessingIdForHistory(null)
    setStatusFilter(null)
    setDurationBucketFilter(null)
    setActiveTab("fetched-contents")
  }
  
  const handleViewWorkflowDetails = useCallback(
    (item: WorkflowExecutionLogData) => {
      openBlade(
        () => import("@/components/workflow-execution-log/workflow-item-details-blade"),
        {
          item,
          onClose: closeTopBlade,
          onViewFetching: openFetchingDetailsBlade,
          onViewProcessing: openProcessingDetailsBlade,
          onViewNormalization: handleViewNormalizationDetails,
          onViewRefinement: handleViewRefinementDetails,
          onViewCalculation: handleViewCalculationDetails,
          onContentClick: handleContentClick,
        },
        item.flux_name || `Flux ${item.flux_id}`,
      )
    },
    [
      openBlade,
      closeTopBlade,
      openFetchingDetailsBlade,
      openProcessingDetailsBlade,
      handleViewNormalizationDetails,
      handleViewRefinementDetails,
      handleViewCalculationDetails,
      handleContentClick,
    ],
  )

  const handleProcessingsClick = (fetchingID: number) => {
    setSelectedFetchingId(fetchingID)
    setSelectedProcessingId(null)
    setSelectedFetchingIdForContent(null)
    setSelectedProcessingIdForHistory(null)
    setStatusFilter(null)
    setDurationBucketFilter(null)
    setActiveTab("history")
    setActiveHistoryTab("processing-history")
  }

  const handleProcessingContentClick = (processingId: number) => {
    setSelectedProcessingId(processingId)
    setSelectedFetchingId(null)
    setSelectedFetchingIdForContent(null)
    setSelectedProcessingIdForHistory(null)
    setStatusFilter(null)
    setDurationBucketFilter(null)
    setActiveTab("fetched-contents")
  }

  const handleViewProcessingHistoryClick = (processingId: number) => {
    setSelectedProcessingIdForHistory(processingId)
    setSelectedProcessingId(null)
    setSelectedFetchingId(null)
    setSelectedFetchingIdForContent(null)
    setStatusFilter(null)
    setDurationBucketFilter(null)
    setActiveTab("history")
    setActiveHistoryTab("processing-history")
  }

  const handleNavigateToFetchedContents = (fetchingID: number) => {
    setSelectedFetchingIdForContent(fetchingID)
    setSelectedProcessingId(null)
    setSelectedFetchingId(null)
    setSelectedProcessingIdForHistory(null)
    setStatusFilter(null)
    setDurationBucketFilter(null)
    setActiveTab("fetched-contents")
  }

  const handleNavigateToFetchedContentsFromProcessing = (processingID: number) => {
    setSelectedProcessingId(processingID)
    setSelectedFetchingId(null)
    setSelectedFetchingIdForContent(null)
    setSelectedProcessingIdForHistory(null)
    setStatusFilter(null)
    setDurationBucketFilter(null)
    setActiveTab("fetched-contents")
  }

  const handleClearFetchingId = () => {
    setSelectedFetchingId(null)
  }

  const handleClearProcessingId = () => {
    setSelectedProcessingId(null)
  }

  const handleClearFetchingIdForContent = () => {
    setSelectedFetchingIdForContent(null)
  }

  const handleClearProcessingIdForHistory = () => {
    setSelectedProcessingIdForHistory(null)
  }

  const handleClearStatusFilter = () => {
    setStatusFilter(null)
  }

  const handleClearDurationBucketFilter = () => {
    setDurationBucketFilter(null)
  }

  const handleClearErrorTypeFilter = () => {
    setErrorTypeFilter(null)
  }

  const handleClearDateFilter = () => {
    setDateFilter(null)
  }

  const { showCustomNotification, hideCustomNotification } = useTestNotification()

  const handleRenameClick = () => {
    setIsRenameDialogOpen(true)
  }

  const handleRenameConfirm = async () => {
    const oldName = fluxName
    const newName = renameValue.trim()
    if (!newName || newName === oldName) {
      setIsRenameDialogOpen(false)
      return
    }
    await updateReportById(Number.parseInt(reportId, 10), { name: newName })
    updateBladeState(reportId, { name: newName })
    setReportName(newName)
    setIsRenameDialogOpen(false)

    const undoAction: NotificationAction = {
      label: "Undo",
      variant: "destructive",
      onClick: async () => {
        await updateReportById(Number.parseInt(reportId, 10), { name: oldName })
        updateBladeState(reportId, { name: oldName })
        setReportName(oldName)
        hideCustomNotification()
      },
    }
    const closeAction: NotificationAction = {
      label: "Close",
      variant: "ghost",
      onClick: () => hideCustomNotification(),
    }
    showCustomNotification(`"${oldName}" renamed to "${newName}"`, [undoAction, closeAction])
  }

  const handleSummaryNavigate = (
    tab: string,
    opts?: { status?: string; durationBucket?: string; errorType?: string; date?: string },
  ) => {
    // Clear all existing filters when navigating from summary
    setSelectedFetchingId(null)
    setSelectedProcessingId(null)
    setSelectedFetchingIdForContent(null)
    setSelectedProcessingIdForHistory(null)

    // Set filters if provided
    setStatusFilter(opts?.status || null)
    setDurationBucketFilter(opts?.durationBucket || null)
    setErrorTypeFilter(opts?.errorType || null)
    setDateFilter(opts?.date || null)
    if (tab === "fetching-history" || tab === "processing-history") {
      setActiveTab("history")
      setActiveHistoryTab(tab)
    } else {
      setActiveTab(tab)
    }
  }

  const forceClose = useCallback(() => {
    closeBlade(reportId)
    closeTopBlade()
  }, [reportId, closeBlade, closeTopBlade])

  const handleMinimize = useCallback(() => {
    if (bladeState?.stackControlled) {
      minimizeStack()
    } else {
      minimizeBlade(reportId)
    }
  }, [bladeState?.stackControlled, minimizeStack, minimizeBlade, reportId])

  const handleMenuAction = (action: FluxMenuAction) => {
    switch (action) {
      case "edit":
        openEditBlade()
        break
      case "rename":
        handleRenameClick()
        break
      case "fetch":
        console.log("Fetch clicked for flux:", reportId)
        break
      case "forceProcess":
        console.log("Force process clicked for flux:", reportId)
        break
      case "remove":
        console.log("Remove clicked for flux:", reportId)
        break
      default:
        console.log("Action", action, "clicked for flux:", reportId)
        break
    }
  }

  const bladeCssZIndex = 9999

  const handleViewProcessingDetailsFromActivity = useCallback(
    async (processingId: number) => {
      try {
        // Fetch the processing data to get the actual flux ID
        const response = await fetch(`/api/processing-history/by-id?processingId=${processingId}`)
        const result = await response.json()
        
        if (result.error || !result.data) {
          console.error("Failed to fetch processing data:", result.error)
          // Fallback to current reportId if API fails
          setProcessingDetail({ id: processingId, name: fluxName, fluxId: reportId })
          return
        }
        
        const actualFluxId = String(result.data.fluxID)
        console.log("🔍 Got actual flux ID for processing", processingId, ":", actualFluxId)
        setProcessingDetail({ id: processingId, name: fluxName, fluxId: actualFluxId })
      } catch (error) {
        console.error("Error fetching processing details:", error)
        // Fallback to current reportId if fetch fails
        setProcessingDetail({ id: processingId, name: fluxName, fluxId: reportId })
      }
    },
    [fluxName, reportId],
  )

  const handleViewFetchingDetailsFromActivity = useCallback(
    (fetchingId: number) => {
      setFetchingDetail({ id: fetchingId, name: fluxName, fluxId: reportId })
    },
    [fluxName, reportId],
  )

  const handleViewNormalizationDetailsFromActivity = useCallback(
    (normalizationId: number) => {
      setNormalizationDetail({ id: normalizationId, name: fluxName, fluxId: reportId })
    },
    [fluxName, reportId],
  )

  const handleViewRefinementDetailsFromActivity = useCallback(
    (refinementId: number) => {
      setRefinementDetail({ id: refinementId, name: fluxName, fluxId: reportId })
    },
    [fluxName, reportId],
  )

  const handleViewCalculationDetailsFromActivity = useCallback(
    (calculationId: number) => {
      setCalculationDetail({ id: calculationId, name: fluxName, fluxId: reportId })
    },
    [fluxName, reportId],
  )

  useEffect(() => {
    const fetchAndSetData = async () => {
      if (reportId) {
        setIsLoading(true)
        setError(null)
        try {
          const idNum = Number.parseInt(reportId, 10)
          if (isNaN(idNum)) throw new Error(`Invalid report ID: "${reportId}"`)

          const res = await fetch(`/api/reports/${idNum}`)
          const json = await res.json()
          if (json.error || !json.data) throw new Error(json.error || "Report not found.")

          const name = json.data.name || `Report #${json.data.id}`
          setReportName(name)
          updateBladeState(reportId, { name })
        } catch (e: any) {
          console.error("ViewFluxBlade: Error fetching report data:", e)
          setError(`Failed to load report data: ${e.message}`)
        } finally {
          setIsLoading(false)
        }
      } else {
        setError("No report ID provided")
        setIsLoading(false)
      }
    }
    fetchAndSetData()
  }, [reportId, updateBladeState])


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (processingDetail) {
          handleCloseProcessingDetails()
        } else if (fetchingDetail) {
          handleCloseFetchingDetails()
        } else if (normalizationDetail) {
          handleCloseNormalizationDetails()
        } else if (refinementDetail) {
          handleCloseRefinementDetails()
        } else if (calculationDetail) {
          handleCloseCalculationDetails()
        } else {
          forceClose()
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [
    forceClose,
    processingDetail,
    fetchingDetail,
    normalizationDetail,
    refinementDetail,
    calculationDetail,
    handleCloseProcessingDetails,
    handleCloseFetchingDetails,
    handleCloseNormalizationDetails,
    handleCloseRefinementDetails,
    handleCloseCalculationDetails,
  ])

  if (!bladeState) return null

  return (
    <>
      <style jsx global>{`
  [data-radix-popper-content-wrapper] {
    z-index: 10050 !important;
  }
  .fixed.inset-0[data-state="open"] {
    z-index: 10040 !important;
    background-color: rgba(0, 0, 0, 0.6) !important;
  }
  [data-radix-dialog-overlay] {
    z-index: 10040 !important;
    background-color: rgba(0, 0, 0, 0.6) !important;
  }
`}</style>
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md z-[10050] [&~div]:z-[10040]" style={{ zIndex: 10050 }}>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Overlay handled by BladeStackProvider */}
      <BaseBlade onClose={forceClose} bladeType="view" zIndex={bladeCssZIndex}>
        <motion.div
          animate={{
            x: 0,
            transform:
              processingDetail ||
              fetchingDetail ||
              normalizationDetail ||
              refinementDetail ||
              calculationDetail ||
              editBladeState
                ? `translateX(-${isNestedPreviewOpen ? 300 : 150}px)`
                : isNestedPreviewOpen
                  ? "translateX(-150px)"
                  : "translateX(0%)",
          }}
          transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
          className="h-full flex flex-col"
          aria-labelledby="blade-title"
        >
        {showProgress && <IndeterminateProgress />}
        <AnimatePresence>
          {(processingDetail || fetchingDetail || normalizationDetail || refinementDetail || calculationDetail) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 z-20"
            />
          )}
        </AnimatePresence>
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between pl-[25px] md:pl-[25px] md:pr-3 border-b shrink-0",
            headerHeight,
          )}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 id="blade-title" className="text-xl font-medium text-gray-800 truncate max-w-[60vw]">
                  {isLoading ? <Skeleton className="h-6 w-40" /> : error ? "Error" : fluxName}
                </h1>
              </TooltipTrigger>
              <TooltipContent>
                <p>{fluxName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden md:flex items-center gap-2 text-[#5f6b7b]">
              <Download className="h-4 w-4" /> Fetch
            </Button>
            <Button variant="ghost" className="hidden md:flex items-center gap-2 text-[#5f6b7b]">
              <Zap className="h-4 w-4" /> Force process
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMinimize}
              className="h-8 w-8 text-gray-500 hover:bg-gray-100"
              aria-label="Minimize"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 z-[10000]" align="end">
                <FluxMenuItems
                  item={{ id: reportId, name: fluxName } as FluxData}
                  onAction={(action) => handleMenuAction(action)}
                  components={{ Item: DropdownMenuItem, Separator: DropdownMenuSeparator }}
                />
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={forceClose}
              className="hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-grow flex flex-col bg-[#F1F3F4] overflow-hidden"
        >
          <div className="sticky top-0 z-10 bg-[#F1F3F4] border-b border-[#e5e7eb] shrink-0">
            <div className="px-4 md:px-6">
              <ResponsiveTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : error ? (
              <div className="p-6 text-red-500 text-center h-64 flex items-center justify-center">
                <p>{error}</p>
              </div>
            ) : (
              TABS.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-0 h-full">
                  {tab.id === "activity" ? (
                    <div className="p-4 md:p-6 flex justify-center">
                      <ActivityFeed
                        fluxId={reportId}
                        onNavigateToFetchedContents={handleNavigateToFetchedContents}
                        onNavigateToFetchedContentsFromProcessing={handleNavigateToFetchedContentsFromProcessing}
                        onViewFetchingDetails={handleViewFetchingDetailsFromActivity}
                        onViewProcessingDetails={handleViewProcessingDetailsFromActivity}
                        onViewWorkflowDetails={handleViewWorkflowDetails}
                        onViewNormalizationDetails={handleViewNormalizationDetailsFromActivity}
                        onViewRefinementDetails={handleViewRefinementDetailsFromActivity}
                        onViewCalculationDetails={handleViewCalculationDetailsFromActivity}
                      />
                    </div>
                  ) : tab.id === "history" ? (
                    <Tabs
                      value={activeHistoryTab}
                      onValueChange={setActiveHistoryTab}
                      className="flex flex-col h-full"
                    >
                      <div className="sticky top-0 z-10 bg-[#F1F3F4] shrink-0">
                        <TabsList role="tablist" className="bg-transparent">
                          {HISTORY_SUBTAB_LIST.map((ht) => (
                            <TabsTrigger
                              key={ht.id}
                              value={ht.id}
                              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0"
                            >
                              {ht.label}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </div>
                      <div className="flex-grow overflow-y-auto">
                        <TabsContent value="workflow-execution-history" className="h-full">
                          <div className="p-4 md:p-6">
                            <WorkflowExecutionLogGrid
                              fluxId={reportId}
                              defaultSortColumn="run_number"
                              defaultSortDirection="desc"
                              includeQuickFlux={false}
                              includeFluxManagement={false}
                              onWorkflowDetailsClick={handleViewWorkflowDetails}
                              onViewClick={handleViewFetchingDetails}
                              onViewProcessingClick={handleViewProcessingDetails}
                              onViewNormalizationClick={handleViewNormalizationDetails}
                              onViewRefinementClick={handleViewRefinementDetails}
                              onViewCalculationClick={handleViewCalculationDetails}
                              onContentClick={handleContentClick}
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="fetching-history" className="h-full">
                          <div className="p-4 md:p-6">
                            <FetchingHistoryGrid
                              fluxId={reportId}
                              onProcessingsClick={handleProcessingsClick}
                              onContentClick={handleContentClick}
                              onViewClick={handleViewFetchingDetails}
                              statusFilter={statusFilter}
                              durationBucketFilter={durationBucketFilter}
                              errorTypeFilter={errorTypeFilter}
                              dateFilter={dateFilter}
                              onClearStatusFilter={handleClearStatusFilter}
                              onClearDurationBucketFilter={handleClearDurationBucketFilter}
                              onClearErrorTypeFilter={handleClearErrorTypeFilter}
                              onClearDateFilter={handleClearDateFilter}
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="processing-history" className="h-full">
                          <div className="p-4 md:p-6">
                            <ProcessingHistoryGrid
                              fluxId={reportId}
                              fetchingIdFilter={selectedFetchingId}
                              processingIdFilter={selectedProcessingIdForHistory}
                              onClearFetchingId={handleClearFetchingId}
                              onClearProcessingId={handleClearProcessingIdForHistory}
                              onProcessingContentClick={handleProcessingContentClick}
                              onViewClick={handleViewProcessingDetails}
                              statusFilter={statusFilter}
                              durationBucketFilter={durationBucketFilter}
                              errorTypeFilter={errorTypeFilter}
                              dateFilter={dateFilter}
                              onClearStatusFilter={handleClearStatusFilter}
                              onClearDurationBucketFilter={handleClearDurationBucketFilter}
                              onClearErrorTypeFilter={handleClearErrorTypeFilter}
                              onClearDateFilter={handleClearDateFilter}
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="normalization-history" className="h-full">
                          <div className="p-4 md:p-6 flex items-center justify-center h-full">
                            <div className="bg-muted rounded-lg h-64 w-full flex flex-col items-center justify-center gap-2">
                              <History className="h-6 w-6 text-gray-400" />
                              <span className="text-gray-500">No data yet</span>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="refinement-history" className="h-full">
                          <div className="p-4 md:p-6 flex items-center justify-center h-full">
                            <div className="bg-muted rounded-lg h-64 w-full flex flex-col items-center justify-center gap-2">
                              <History className="h-6 w-6 text-gray-400" />
                              <span className="text-gray-500">No data yet</span>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="calculation-history" className="h-full">
                          <div className="p-4 md:p-6 flex items-center justify-center h-full">
                            <div className="bg-muted rounded-lg h-64 w-full flex flex-col items-center justify-center gap-2">
                              <History className="h-6 w-6 text-gray-400" />
                              <span className="text-gray-500">No data yet</span>
                            </div>
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  ) : tab.id === "fetched-contents" ? (
                    <div className="p-4 md:p-6">
                      <FetchedContentsGrid
                        fluxId={reportId}
                        processingIdFilter={selectedProcessingId}
                        fetchingIdFilter={selectedFetchingIdForContent}
                        onClearProcessingId={handleClearProcessingId}
                        onClearFetchingId={handleClearFetchingIdForContent}
                        onProcessingClick={handleViewProcessingHistoryClick}
                        onPreviewClick={handlePreviewFile}
                      />
                    </div>
                  ) : tab.id === "summary" ? (
                    <div className="p-4 md:p-6">
                      <SummaryOverview
                        fluxId={reportId}
                        onNavigate={handleSummaryNavigate}
                        onNavigateToFetchedContents={handleNavigateToFetchedContents}
                        onNavigateToFetchedContentsFromProcessing={handleNavigateToFetchedContentsFromProcessing}
                        onViewFetchingDetails={handleViewFetchingDetailsFromActivity}
                        onViewProcessingDetails={handleViewProcessingDetailsFromActivity}
                        onViewWorkflowDetails={handleViewWorkflowDetails}
                        onViewNormalizationDetails={handleViewNormalizationDetailsFromActivity}
                        onViewRefinementDetails={handleViewRefinementDetailsFromActivity}
                        onViewCalculationDetails={handleViewCalculationDetailsFromActivity}
                      />
                    </div>
                  ) : tab.id === "flux-details" ? (
                    <div className="p-4 md:p-6">
                      <FluxDetails reportId={reportId} />
                    </div>
                  ) : (
                    <div className="p-4 md:p-6">
                      <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                          <tab.icon className="h-6 w-6" />
                          {tab.label}
                        </h2>
                        <div className="h-64 flex items-center justify-center text-gray-400">
                          Placeholder for {tab.label}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))
            )}
          </div>
        </Tabs>
        </motion.div>
      <AnimatePresence>
        {processingDetail && (
          <ProcessingHistoryDetailsBlade
            processingId={processingDetail.id}
            fluxName={processingDetail.name}
            fluxId={processingDetail.fluxId}
            onClose={handleCloseProcessingDetails}
            onFluxDetails={() => setActiveTab("flux-details")}
            onPreviewOpenChange={setIsNestedPreviewOpen}
          />
        )}
        {fetchingDetail && (
          <FetchingHistoryDetailsBlade
            fetchingId={fetchingDetail.id}
            fluxName={fetchingDetail.name}
            fluxId={reportId}
            onClose={handleCloseFetchingDetails}
            onFluxDetails={() => setActiveTab("flux-details")}
          />
        )}
        {normalizationDetail && (
          <NormalizationDetailsBlade
            normalizationId={normalizationDetail.id}
            fluxName={normalizationDetail.name}
            fluxId={reportId}
            onClose={handleCloseNormalizationDetails}
            onFluxDetails={() => setActiveTab("flux-details")}
          />
        )}
        {refinementDetail && (
          <RefinementDetailsBlade
            refinementId={refinementDetail.id}
            fluxName={refinementDetail.name}
            fluxId={reportId}
            onClose={handleCloseRefinementDetails}
            onFluxDetails={() => setActiveTab("flux-details")}
          />
        )}
        {calculationDetail && (
          <CalculationDetailsBlade
            calculationId={calculationDetail.id}
            fluxName={calculationDetail.name}
            fluxId={reportId}
            onClose={handleCloseCalculationDetails}
            onFluxDetails={() => setActiveTab("flux-details")}
          />
        )}
      </AnimatePresence>
    </BaseBlade>
    </>
  )
}
