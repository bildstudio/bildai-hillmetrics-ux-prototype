"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CheckCircle,
  RefreshCw,
  XCircle,
  Clock,
} from "lucide-react"
import type { StageStatusResult } from "@/app/actions/workflow-stage-statuses"

interface StepsBadgeProps {
  steps: number | null
  fetchingId: number | null
  processingId: number | null
  normalizationId: number | null
  refinementId: number | null
  calculationId: number | null
  fluxId: number
  fluxName: string
  onViewFetching?: (fetchingID: number, fluxId?: number, fluxName?: string) => void
  onViewProcessing?: (
    processingID: number,
    fluxId?: number,
    fluxName?: string,
  ) => void
  onViewNormalization?: (
    normalizationID: number,
    fluxId?: number,
    fluxName?: string,
  ) => void
  onViewRefinement?: (
    refinementID: number,
    fluxId?: number,
    fluxName?: string,
  ) => void
  onViewCalculation?: (
    calculationID: number,
    fluxId?: number,
    fluxName?: string,
  ) => void
}

export function StepsBadge({
  steps,
  fetchingId,
  processingId,
  normalizationId,
  refinementId,
  calculationId,
  fluxId,
  fluxName,
  onViewFetching,
  onViewProcessing,
  onViewNormalization,
  onViewRefinement,
  onViewCalculation,
}: StepsBadgeProps) {
  const [open, setOpen] = useState(false)
  const [statuses, setStatuses] = useState<StageStatusResult>({})
  const [loading, setLoading] = useState(false)
  const [ellipsisStep, setEllipsisStep] = useState(0)

  useEffect(() => {
    if (open) {
      setLoading(true)
      setStatuses({})
      const params = new URLSearchParams()
      if (fetchingId) params.set("fetchingId", String(fetchingId))
      if (processingId) params.set("processingId", String(processingId))
      if (normalizationId) params.set("normalizationId", String(normalizationId))
      if (refinementId) params.set("refinementId", String(refinementId))
      if (calculationId) params.set("calculationId", String(calculationId))
      fetch(`/api/workflow-stage-statuses?${params.toString()}`)
        .then((r) => r.json())
        .then((res: { data: StageStatusResult; error: unknown }) => {
          if (!res.error) setStatuses(res.data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [open, fetchingId, processingId, normalizationId, refinementId, calculationId])

  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setEllipsisStep((e) => (e + 1) % 4)
    }, 500)
    return () => clearInterval(interval)
  }, [loading])

  const dots = '.'.repeat(ellipsisStep)
  const getLabel = (stage: string, status?: string | null) =>
    loading ? `${stage} status - Loading${dots}` : `${stage} status - ${status ?? 'Not started'}`

  const getIcon = (
    stage: 'fetching' | 'processing' | 'normalization' | 'refinement' | 'calculation',
    status?: string | null,
  ) => {
    if (loading) return <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />
    if (!status) return <Clock className="w-4 h-4 text-gray-500" />
    const s = status.toLowerCase()
    if (s.includes('success')) return <CheckCircle className="w-4 h-4 text-green-500" />
    if (s.includes('currently') || s.includes('in progress') || s.includes('progress')) {
      const color = stage === 'processing' ? 'text-orange-500' : 'text-blue-500'
      return <RefreshCw className={`w-4 h-4 ${color} animate-spin`} />
    }
    if (s.includes('failed') || s.includes('error')) return <XCircle className="w-4 h-4 text-red-500" />
    if (s.includes('not started')) return <Clock className="w-4 h-4 text-gray-500" />
    return <Clock className="w-4 h-4 text-gray-500" />
  }

  const buttons = [
    {
      stage: 'Fetching',
      status: statuses.fetching,
      disabled: loading || !fetchingId || !statuses.fetching,
      onClick: () => {
        if (fetchingId) onViewFetching?.(fetchingId, fluxId, fluxName)
        setOpen(false)
      },
    },
    {
      stage: 'Processing',
      status: statuses.processing,
      disabled: loading || !processingId || !statuses.processing,
      onClick: () => {
        if (processingId) onViewProcessing?.(processingId, fluxId, fluxName)
        setOpen(false)
      },
    },
    {
      stage: 'Normalization',
      status: statuses.normalization,
      disabled: loading || !normalizationId || !statuses.normalization,
      onClick: () => {
        if (normalizationId) onViewNormalization?.(normalizationId, fluxId, fluxName)
        setOpen(false)
      },
    },
    {
      stage: 'Refinement',
      status: statuses.refinement,
      disabled: loading || !refinementId || !statuses.refinement,
      onClick: () => {
        if (refinementId) onViewRefinement?.(refinementId, fluxId, fluxName)
        setOpen(false)
      },
    },
    {
      stage: 'Calculation',
      status: statuses.calculation,
      disabled: loading || !calculationId || !statuses.calculation,
      onClick: () => {
        if (calculationId) onViewCalculation?.(calculationId, fluxId, fluxName)
        setOpen(false)
      },
    },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge className="bg-black text-white hover:bg-gray-300 cursor-pointer rounded-full px-2">
          {steps ?? 0}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="bg-white text-black space-y-2 w-72">
        <h4 className="text-sm font-medium">Workflow stages status:</h4>
        {buttons.map((b, idx) => (
          <Button
            key={idx}
            variant="outline"
            disabled={b.disabled}
            className="w-full justify-start gap-2"
            onClick={b.onClick}
          >
            {getIcon(b.stage.toLowerCase() as any, b.status)}
            {getLabel(b.stage, b.status)}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
