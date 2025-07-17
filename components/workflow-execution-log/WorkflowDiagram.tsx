"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ReactFlow, { Controls, type Edge, type Node, MarkerType, Handle, Position } from "reactflow"
import "@/styles/reactflow.css"
import type { WorkflowExecutionLogData } from "@/app/actions/workflow-execution-log"
import { WORKFLOW_STAGE_ORDER } from "@/lib/workflow-stage-order"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { format, parseISO } from "date-fns"
import type { WorkflowStageDetailData } from "@/app/actions/workflow-stage-details"
import { getWorkflowStageDetails } from "@/app/actions/workflow-stage-details"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  Maximize2,
  Minimize2,
  CheckCircle,
  RefreshCw,
  XCircle,
  MoreVertical,
  FileText,
} from "lucide-react"

interface WorkflowDiagramProps {
  item: WorkflowExecutionLogData
  onViewFetching?: (id: number) => void
  onViewProcessing?: (id: number) => void
  onViewNormalization?: (id: number) => void
  onViewRefinement?: (id: number) => void
  onViewCalculation?: (id: number) => void
  onViewWorkflow?: (id: number) => void
  onContentClick?: (fetchingId: number) => void
  onPreviewFile?: (contentId: number, contentName: string) => void
  cardStatusBackground?: {
    success?: string
    failed?: string
    progress?: string
  }
  highlightStageId?: number
  isOnWorkflowBlade?: boolean
}

interface StageInfo {
  id: string
  label: string
  stage: keyof typeof WORKFLOW_STAGE_ORDER
  runId: number
  stage_order?: number
  count: number
  click?: () => void
}

export default function WorkflowDiagram({
  item,
  onViewFetching,
  onViewProcessing,
  onViewNormalization,
  onViewRefinement,
  onViewCalculation,
  onViewWorkflow,
  onContentClick,
  onPreviewFile,
  cardStatusBackground,
  highlightStageId,
  isOnWorkflowBlade = false,
}: WorkflowDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [subCounts, setSubCounts] = useState<Record<string, number>>({})
  const [childData, setChildData] = useState<Record<string, any[]>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [stageDetails, setStageDetails] = useState<Record<number, WorkflowStageDetailData>>({})
  const [selected, setSelected] = useState<string | null>(null)

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => null)
    } else {
      document.exitFullscreen().catch(() => null)
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  useEffect(() => {
    getWorkflowStageDetails(item.id)
      .then((res) => {
        const counts: Record<string, number> = {}
        res.data.forEach((r) => {
          const key = String(r.stage_type || "").toLowerCase()
          if (typeof r.sub_process_count === "number") {
            counts[key] = r.sub_process_count
          }
        })
        setSubCounts(counts)
      })
      .catch(() => setSubCounts({}))
  }, [item.id])


  const stages: StageInfo[] = useMemo(() => {
    const s: StageInfo[] = []
    if (item.fetching_id) {
      s.push({
        id: `fetching-${item.fetching_id}`,
        label: `Fetching ${item.fetching_id}`,
        stage: "fetching",
        runId: item.fetching_id,
        stage_order: stageDetails[item.fetching_id]?.stage_order,
        count:
          stageDetails[item.fetching_id]?.sub_process_count ??
          subCounts["fetching"] ??
          item.content_count ??
          0,
        click: () => onViewFetching?.(item.fetching_id!),
      })
    }
    if (item.processing_id) {
      s.push({
        id: `processing-${item.processing_id}`,
        label: `Processing ${item.processing_id}`,
        stage: "processing",
        runId: item.processing_id,
        stage_order: stageDetails[item.processing_id]?.stage_order,
        count:
          stageDetails[item.processing_id]?.sub_process_count ??
          subCounts["processing"] ??
          0,
        click: () => onViewProcessing?.(item.processing_id!),
      })
    }
    if (item.normalization_id) {
      s.push({
        id: `normalization-${item.normalization_id}`,
        label: `Normalization ${item.normalization_id}`,
        stage: "normalization",
        runId: item.normalization_id,
        stage_order: stageDetails[item.normalization_id]?.stage_order,
        count:
          stageDetails[item.normalization_id]?.sub_process_count ??
          subCounts["normalization"] ??
          0,
        click: () => onViewNormalization?.(item.normalization_id!),
      })
    }
    if (item.refinement_id) {
      s.push({
        id: `refinement-${item.refinement_id}`,
        label: `Refinement ${item.refinement_id}`,
        stage: "refinement",
        runId: item.refinement_id,
        stage_order: stageDetails[item.refinement_id]?.stage_order,
        count:
          stageDetails[item.refinement_id]?.sub_process_count ??
          subCounts["refinement"] ??
          0,
        click: () => onViewRefinement?.(item.refinement_id!),
      })
    }
    if (item.calculation_id) {
      s.push({
        id: `calculation-${item.calculation_id}`,
        label: `Calculation ${item.calculation_id}`,
        stage: "calculation",
        runId: item.calculation_id,
        stage_order: stageDetails[item.calculation_id]?.stage_order,
        count:
          stageDetails[item.calculation_id]?.sub_process_count ??
          subCounts["calculation"] ??
          0,
        click: () => onViewCalculation?.(item.calculation_id!),
      })
    }
    return s.sort((a, b) => {
      const av = a.stage_order ?? WORKFLOW_STAGE_ORDER[a.stage]
      const bv = b.stage_order ?? WORKFLOW_STAGE_ORDER[b.stage]
      return av - bv
    })
  }, [
    item,
    subCounts,
    stageDetails,
    onViewFetching,
    onViewProcessing,
    onViewNormalization,
    onViewRefinement,
    onViewCalculation,
  ])

  useEffect(() => {
    getWorkflowStageDetails(item.id).then(({ data }) => {
      const map: Record<number, WorkflowStageDetailData> = {}
      ;(data || []).forEach((d) => {
        map[d.id] = d
      })
      setStageDetails(map)
    })
  }, [item.id])

  // Fetch child data when stage is expanded
  useEffect(() => {
    Object.keys(expanded).forEach(async (stageId) => {
      if (expanded[stageId] && !childData[stageId]) {
        const stage = stages.find(s => s.id === stageId)
        if (!stage) return

        let childItems: any[] = []
        try {
          if (stage.stage === "fetching" && item.fetching_id) {
            const { fetchFetchingDetails } = await import("@/app/actions/fetching-content-history")
            const result = await fetchFetchingDetails(item.fetching_id)
            if (!result.error && result.data) {
              childItems = result.data.items.map(item => ({
                id: item.contentID,
                name: item.contentName || `Content ${item.contentID}`,
                status: item.status,
                progress: item.status === "Success" ? 100 : 0
              }))
            }
          } else if (stage.stage === "processing" && item.processing_id) {
            const { fetchProcessingDetails } = await import("@/app/actions/processing-content-history")
            const result = await fetchProcessingDetails(item.processing_id)
            if (!result.error && result.data) {
              childItems = result.data.items.map(item => ({
                id: item.contentID,
                name: item.contentName || `Content ${item.contentID}`,
                status: item.status,
                progress: item.status === "Success" ? 100 : 0,
                statistics: item.statistics
              }))
            }
          }
          // TODO: Add normalization, refinement, calculation when APIs are available
          
          setChildData(prev => ({ ...prev, [stageId]: childItems }))
        } catch (error) {
          console.error(`Failed to fetch child data for ${stageId}:`, error)
        }
      }
    })
  }, [expanded, stages, item])

  const nodes: Node[] = useMemo(() => {
    const cardWidth = 320
    const cardHeight = 160
    const workflowHeaderHeight = 180
    const headerSpacing = 80
    const stageSpacing = 200
    const childCardHeight = 120
    const childSpacing = 20
    const minChildSpacing = childCardHeight + childSpacing
    const n: Node[] = []

    // Add workflow header card (main run info)
    const workflowHeaderY = -workflowHeaderHeight - headerSpacing
    n.push({
      id: `workflow-header-${item.id}`,
      position: { x: 0, y: workflowHeaderY },
      data: { 
        label: `Workflow Run #${item.run_number || item.id}`,
        workflowItem: item,
        isWorkflowHeader: true
      },
      draggable: false,
      selectable: false,
      type: "workflow-header",
    })

    // Helper function to check if two rectangles overlap
    const doRectsOverlap = (rect1: any, rect2: any) => {
      return !(rect1.right <= rect2.left || 
               rect2.right <= rect1.left || 
               rect1.bottom <= rect2.top || 
               rect2.bottom <= rect1.top)
    }

    // First pass: collect all child groups and calculate their ideal positions
    const childGroups: Array<{
      stageId: string,
      stageY: number,
      children: Array<{
        id: string,
        data: any
      }>,
      idealCenterY: number
    }> = []

    stages.forEach((stage, idx) => {
      const y = idx * stageSpacing
      n.push({
        id: stage.id,
        position: { x: 0, y },
        data: { label: stage.label, stage, detail: stageDetails[stage.runId] },
        draggable: false,
        selectable: false,
        type: "stage",
      })
      
      if (expanded[stage.id]) {
        const children = childData[stage.id] || []
        const displayCount = Math.max(children.length, stage.count)
        
        const childNodes = []
        for (let i = 0; i < displayCount; i++) {
          const childId = `${stage.id}-child-${i}`
          const childItem = children[i]
          
          childNodes.push({
            id: childId,
            data: { 
              label: childItem ? childItem.name : `Item ${i + 1}`,
              parent: stage.id,
              childItem: childItem,
              stage: stage.stage
            }
          })
        }
        
        childGroups.push({
          stageId: stage.id,
          stageY: y,
          children: childNodes,
          idealCenterY: y + (cardHeight / 2) // Center of parent stage
        })
      }
    })

    // Second pass: position groups with minimal spacing and proper centering
    const childX = cardWidth + 60
    const groupSpacing = minChildSpacing * 1.5 // Reduced from 3x to 1.5x for tighter layout
    
    // Sort groups by their ideal Y position (stage order)
    childGroups.sort((a, b) => a.idealCenterY - b.idealCenterY)
    
    // Calculate positions with priority on centering around parent stages
    const finalPositions: Array<{
      group: typeof childGroups[0],
      startY: number
    }> = []
    
    childGroups.forEach((group, index) => {
      const groupHeight = (group.children.length - 1) * minChildSpacing + childCardHeight
      let bestStartY = group.idealCenterY - (groupHeight / 2) // Start with ideal position
      
      // Check for conflicts with already positioned groups
      for (let i = 0; i < finalPositions.length; i++) {
        const positioned = finalPositions[i]
        const positionedHeight = (positioned.group.children.length - 1) * minChildSpacing + childCardHeight
        const positionedEndY = positioned.startY + positionedHeight
        
        // Check if current position overlaps with this positioned group
        const currentEndY = bestStartY + groupHeight
        const overlap = !(currentEndY + groupSpacing <= positioned.startY || 
                         bestStartY >= positionedEndY + groupSpacing)
        
        if (overlap) {
          // Move to the closest non-overlapping position
          const moveDown = positionedEndY + groupSpacing
          const moveUp = positioned.startY - groupHeight - groupSpacing
          
          // Choose the option that keeps us closer to ideal position
          const idealCenter = group.idealCenterY
          const downDistance = Math.abs((moveDown + groupHeight/2) - idealCenter)
          const upDistance = Math.abs((moveUp + groupHeight/2) - idealCenter)
          
          if (downDistance <= upDistance) {
            bestStartY = moveDown
          } else {
            bestStartY = moveUp
          }
        }
      }
      
      finalPositions.push({
        group,
        startY: bestStartY
      })
      
      // Position all children in this group
      group.children.forEach((child, i) => {
        const childY = bestStartY + (i * minChildSpacing)
        
        n.push({
          id: child.id,
          position: { x: childX, y: childY },
          data: child.data,
          draggable: false,
          selectable: false,
          type: "child",
        })
      })
    })

    return n
  }, [stages, expanded, stageDetails, childData])

  const edges: Edge[] = useMemo(() => {
    const e: Edge[] = []

    // Add edge from workflow header to first stage
    if (stages.length > 0) {
      e.push({
        id: `workflow-header-${item.id}-${stages[0].id}`,
        source: `workflow-header-${item.id}`,
        target: stages[0].id,
        type: "smoothstep",
        style: { strokeWidth: 4, stroke: "#4F46E5" },
        markerEnd: { type: MarkerType.ArrowClosed, width: 10, height: 10, color: "#4F46E5" },
      })
    }

    for (let i = 0; i < stages.length - 1; i++) {
      e.push({
        id: `${stages[i].id}-${stages[i + 1].id}`,
        source: stages[i].id,
        target: stages[i + 1].id,
        type: "smoothstep",
        style: { strokeWidth: 3, stroke: "#000000" },
        markerEnd: { type: MarkerType.ArrowClosed, width: 8, height: 8, color: "#000000" },
      })
    }

    stages.forEach((stage) => {
      if (expanded[stage.id] && stage.count > 0) {
        for (let i = 0; i < stage.count; i++) {
          const childId = `${stage.id}-child-${i}`
          e.push({
            id: `${stage.id}-${childId}`,
            source: stage.id,
            sourceHandle: "children",
            target: childId,
            type: "smoothstep",
            style: { strokeWidth: 2, stroke: "#666666" },
            markerEnd: { type: MarkerType.ArrowClosed, width: 6, height: 6, color: "#666666" },
          })
        }
      }
    })

    return e
  }, [stages, expanded, item])

  const toggleStage = useCallback((id: string) => {
    setExpanded((p) => ({ ...p, [id]: !p[id] }))
  }, [])



  const getRunningStatus = useCallback(
    (progress: number, ellipsis: number) => {
      const dots = '.'.repeat(ellipsis + 1)
      if (progress >= 100) return 'Completed – Workflow finished successfully.'
      if (progress >= 95) return `Completing${dots}`
      if (progress >= 40) return `InProgress – Current step running${dots}`
      if (progress >= 5) return `Processing – Data processing underway${dots}`
      return `Created – Workflow initialized${dots}`
    },
    [],
  )

  const nodeTypes = useMemo(
    () => ({
      "workflow-header": ({ id, data }: any) => {
        const workflowItem = data.workflowItem as WorkflowExecutionLogData
        const runNumber = workflowItem.run_number || workflowItem.id
        const status = workflowItem.status?.toLowerCase() || "unknown"
        const progress = workflowItem.progress ?? 0
        const duration = (() => {
          if (workflowItem.duration_active == null) return "00:00"
          const totalSec = Math.round(workflowItem.duration_active * 60)
          const m = Math.floor(totalSec / 60)
          const s = totalSec % 60
          return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        })()
        const started = workflowItem.started_at
          ? format(parseISO(workflowItem.started_at), "yyyy-MM-dd HH:mm")
          : "–"
        const completed = workflowItem.completed_at
          ? format(parseISO(workflowItem.completed_at), "yyyy-MM-dd HH:mm")
          : "–"
        const contentCount = workflowItem.content_count || 0

        let iconBg = 'bg-gray-400'
        let Icon = CheckCircle
        let statusHex = '#6B7280'
        
        if (status.includes('error') || status.includes('fail')) {
          iconBg = 'bg-red-500'
          statusHex = '#D32F2F'
          Icon = XCircle
        } else if (status.includes('progress') || status.includes('current') || status.includes('running')) {
          iconBg = 'bg-blue-500'
          statusHex = '#1E88E5'
          Icon = RefreshCw
        } else if (status.includes('success') || status.includes('complete')) {
          iconBg = 'bg-green-500'
          statusHex = '#2E7D32'
          Icon = CheckCircle
        }

        return (
          <div className="bg-white border-2 border-indigo-200 rounded-xl shadow-lg p-4 w-80" style={{ pointerEvents: 'all' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`${iconBg} p-2 rounded-full`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Workflow Run #{runNumber}
                  </h3>
                  <p className="text-xs text-indigo-600 font-medium">
                    Main Execution Flow
                  </p>
                </div>
              </div>
              <Badge
                className={`text-white text-xs px-2 py-0.5 ${!isOnWorkflowBlade ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                style={{ 
                  backgroundColor: '#4F46E5',
                  pointerEvents: 'auto',
                  zIndex: 1000
                }}
                onClick={!isOnWorkflowBlade ? (e) => {
                  e.stopPropagation()
                  onViewWorkflow?.(workflowItem.id)
                } : undefined}
              >
                ID: {workflowItem.id}
              </Badge>
            </div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-600">Progress</span>
                <span className="text-xs font-medium" style={{ color: statusHex }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, progress))}%`,
                    backgroundColor: statusHex
                  }}
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Started:</span>
                <span className="text-gray-900 font-mono">{started}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="text-gray-900 font-mono">{duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Content:</span>
                <span className="text-gray-900 font-medium">{contentCount} items</span>
              </div>
              {workflowItem.completed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="text-gray-900 font-mono">{completed}</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-indigo-600 text-center font-medium">
                🔄 Main workflow execution containing all stages
              </p>
            </div>
            
            <Handle
              type="source"
              position={Position.Bottom}
              style={{ background: '#4F46E5', border: '2px solid white', width: '10px', height: '10px' }}
            />
          </div>
        )
      },
      child: ({ id, data }: any) => {
        const childItem = data.childItem
        const stageName = data.stage ? `${data.stage.charAt(0).toUpperCase()}${data.stage.slice(1)} Item` : "Item"
        const itemStatus = childItem?.status?.toLowerCase() ?? 'unknown'
        const itemProgress = childItem?.progress ?? 0
        
        let iconBg = 'bg-gray-400'
        let Icon = CheckCircle
        let statusHex = '#6B7280'
        
        if (itemStatus.includes('error') || itemStatus.includes('fail')) {
          iconBg = 'bg-red-500'
          statusHex = '#D32F2F'
          Icon = XCircle
        } else if (itemStatus.includes('progress') || itemStatus.includes('current')) {
          iconBg = 'bg-blue-500'
          statusHex = '#1E88E5'
          Icon = RefreshCw
        } else if (itemStatus.includes('success') || itemStatus.includes('complete')) {
          iconBg = 'bg-green-600'
          statusHex = '#18A350'
          Icon = CheckCircle
        }

        return (
          <div className="relative w-80 h-32">
            <Handle
              type="target"
              position={Position.Left}
              style={{ background: '#000000', border: '2px solid white', width: '6px', height: '6px' }}
            />
            <div
              className="flex flex-col gap-2 p-3 w-80 h-32 rounded-md border bg-card shadow-sm"
              style={{ borderColor: statusHex, pointerEvents: 'all' }}
            >
              <div className="flex items-center gap-2">
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center', iconBg)}>
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-medium flex-1 text-left">{stageName}</span>
                <Badge
                  className="text-white text-xs px-2 py-0.5 cursor-pointer hover:opacity-80"
                  style={{ 
                    backgroundColor: statusHex,
                    pointerEvents: 'auto',
                    zIndex: 1000
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (childItem?.id && childItem?.name && onPreviewFile) {
                      onPreviewFile(childItem.id, childItem.name)
                    }
                  }}
                >
                  ID: {childItem?.id || 'N/A'}
                </Badge>
              </div>
              
              <div className="text-xs text-gray-600 truncate">
                {childItem?.name || data.label}
              </div>
              
              <Progress
                value={itemProgress}
                indicatorColor={statusHex}
                className="h-1.5"
              />
              
              <div className="text-xs text-gray-500">
                Status: {childItem?.status || 'Unknown'}
              </div>
            </div>
          </div>
        )
      },
      stage: ({ id, data }: any) => {
        const stage = data.stage as StageInfo | undefined
        const detail = data.detail as WorkflowStageDetailData | undefined
        const stageName = detail
          ? detail.stage_type ??
            (stage?.stage
              ? `${stage.stage.charAt(0).toUpperCase()}${stage.stage.slice(1)}`
              : data.label)
          : "Loading"
        const stageProgress = detail?.progress ?? 0
        const duration = (() => {
          if (detail?.duration_minutes == null) return "00:00"
          const totalSec = Math.round(detail.duration_minutes * 60)
          const m = Math.floor(totalSec / 60)
          const s = totalSec % 60
          return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        })()
        const started = detail?.stage_started
          ? format(parseISO(detail.stage_started), "yyyy-MM-dd HH:mm")
          : "–"
        const ended = detail?.stage_end
          ? format(parseISO(detail.stage_end), "yyyy-MM-dd HH:mm")
          : "–"

        const hasChildren = stage && stage.count > 0
        const stageStatus = detail?.status?.toLowerCase() ?? ''
        const [progress, setProgress] = useState(stageProgress)
        const [ellipsis, setEllipsis] = useState(0)

        useEffect(() => {
          setProgress(stageProgress)
        }, [stageProgress])

        useEffect(() => {
          if (!(stageStatus.includes('progress') || stageStatus.includes('current')))
            return
          const int = setInterval(() => {
            setProgress((p) => (p >= 100 ? 100 : p + 2))
          }, 1000)
          const elInt = setInterval(() => {
            setEllipsis((e) => (e + 1) % 3)
          }, 250)
          return () => {
            clearInterval(int)
            clearInterval(elInt)
          }
        }, [stageStatus])

        let iconBg = 'bg-gray-400'
        let Icon = CheckCircle
        let statusHex = '#6B7280'
        const highlight = stage?.runId === highlightStageId
        let cardBg: string | undefined
        if (stageStatus.includes('error') || stageStatus.includes('fail')) {
          iconBg = 'bg-red-500'
          statusHex = '#D32F2F'
          Icon = XCircle
          if (highlight) cardBg = cardStatusBackground?.failed
        } else if (stageStatus.includes('progress') || stageStatus.includes('current')) {
          iconBg = 'bg-blue-500'
          statusHex = '#1E88E5'
          Icon = RefreshCw
          if (highlight) cardBg = cardStatusBackground?.progress
        } else if (stageStatus.includes('success') || stageStatus.includes('complete')) {
          iconBg = 'bg-green-600'
          statusHex = '#18A350'
          Icon = CheckCircle
          if (highlight) cardBg = cardStatusBackground?.success
        }

        return (
          <div className="relative w-80 h-40">
            <Handle
              type="target"
              position={Position.Top}
              style={{ background: '#000000', border: '2px solid white', width: '8px', height: '8px' }}
            />
            <div
              className={cn('flex flex-col gap-2 p-4 w-80 h-40 rounded-md border bg-card shadow')}
              style={{ borderColor: statusHex, backgroundColor: cardBg, pointerEvents: 'all' }}
            >
              <div className="flex items-center gap-2">
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', iconBg)}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium flex-1 text-left">{stageName}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-500 hover:bg-gray-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => stage?.click?.()}>
                      View details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {stage && (
                <Badge
                  className="text-white w-max cursor-pointer select-none hover:opacity-80"
                  style={{ 
                    backgroundColor: statusHex,
                    pointerEvents: 'auto',
                    zIndex: 1000
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    stage.click?.()
                  }}
                >
                  ID: {stage.runId}
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-gray-600">
                      {stageProgress}% progress – Duration: {duration}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p>Stage Started: {started}</p>
                    <p>Stage End: {ended}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Progress
                value={stageStatus.includes('progress') || stageStatus.includes('current') ? progress : stageProgress}
                indicatorColor={statusHex}
                className="h-2"
              />
              {stageStatus.includes('progress') || stageStatus.includes('current') ? (
                <div className="text-xs text-gray-600">
                  {getRunningStatus(progress, ellipsis)}
                </div>
              ) : (
                <div className="text-xs text-gray-600">
                  {detail?.error_message || 'No error message'}
                </div>
              )}
            </div>
            {highlight && (
              <div className="absolute bottom-2 left-2 w-5 h-5 rounded-full bg-black flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
            {hasChildren && (
              <button
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center cursor-pointer hover:bg-gray-800 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStage(id)
                }}
                style={{ pointerEvents: 'all' }}
              >
                {stage?.count}
              </button>
            )}
            <Handle
              type="source"
              position={Position.Bottom}
              style={{ background: '#000000', border: '2px solid white', width: '8px', height: '8px' }}
            />
            {hasChildren && (
              <Handle
                type="source"
                position={Position.Right}
                id="children"
                style={{ background: '#000000', border: '2px solid white', width: '8px', height: '8px', top: '50%' }}
              />
            )}
          </div>
        )
      },
    }),
    [expanded, toggleStage, item, stageDetails, cardStatusBackground, highlightStageId]
  )

  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center text-gray-500">
        <FileText className="h-16 w-16 mb-4 text-gray-300" />
        <p className="text-lg">No workflow data found for this item.</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll
        panOnDrag
        className="bg-gray-100"
      >
        {/* Replace the existing Controls and fullscreen button with this vertical toolbar */}
        <div className="absolute top-6 right-2 z-50 flex flex-col gap-2">
          {/* Fullscreen button */}
          <div className="bg-white rounded-md shadow-sm flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              aria-label="Fullscreen"
              className="h-8 w-8 text-gray-500 hover:bg-gray-100 rounded-md p-0 flex items-center justify-center"
            >
              <div className="flex items-center justify-center w-full h-full">
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </div>
            </Button>
          </div>

          {/* Custom vertical controls container */}
          <div className="bg-white rounded-md shadow-sm flex flex-col">
            <Controls
              position="top-right"
              showInteractive={false}
              className="flex flex-col !relative !top-0 !right-0"
              style={{ position: "relative", top: 0, right: 0 }}
            />
          </div>
        </div>
      </ReactFlow>
    </div>
  )
}
