"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useBladeStack } from "@/lib/blade-stack-context"

export default function WorkflowStagePage() {
  const params = useParams<{ stageType: string; stageId: string }>()
  const { openBlade, closeTopBlade } = useBladeStack()
  const router = useRouter()

  useEffect(() => {
    if (!params?.stageType || !params?.stageId) return
    const id = Number(params.stageId)
    let importer: any = null
    const props: any = { onClose: closeTopBlade }
    switch (params.stageType.toLowerCase()) {
      case "fetching":
        importer = () => import("@/components/fetching-history/fetching-history-details-blade")
        props.fetchingId = id
        props.fluxName = `Stage ${id}`
        props.fluxId = ""
        break
      case "processing":
        importer = () => import("@/components/processing-history/processing-history-details-blade")
        props.processingId = id
        props.fluxName = `Stage ${id}`
        props.fluxId = ""
        break
      case "normalization":
        importer = () => import("@/components/normalization-history/NormalizationDetailsBlade")
        props.normalizationId = id
        props.fluxName = `Stage ${id}`
        props.fluxId = ""
        break
      case "refinement":
        importer = () => import("@/components/refinement-history/RefinementDetailsBlade")
        props.refinementId = id
        props.fluxName = `Stage ${id}`
        props.fluxId = ""
        break
      case "calculation":
        importer = () => import("@/components/calculation-history/CalculationDetailsBlade")
        props.calculationId = id
        props.fluxName = `Stage ${id}`
        props.fluxId = ""
        break
      default:
        return
    }
    openBlade(importer, props, `Stage ${id}`)
  }, [params, openBlade, closeTopBlade])

  useEffect(() => {
    return () => {
      closeTopBlade()
    }
  }, [closeTopBlade])

  return null
}
