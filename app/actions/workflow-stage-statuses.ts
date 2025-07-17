"use server"

import { createServerClient } from "@/lib/supabase-server-client"
import type { PostgrestError } from "@supabase/supabase-js"

export interface StageStatusResult {
  fetching?: string | null
  processing?: string | null
  normalization?: string | null
  refinement?: string | null
  calculation?: string | null
}

interface Params {
  fetchingId?: number | null
  processingId?: number | null
  normalizationId?: number | null
  refinementId?: number | null
  calculationId?: number | null
}

export async function getWorkflowStageStatuses({
  fetchingId,
  processingId,
  normalizationId,
  refinementId,
  calculationId,
}: Params): Promise<{ data: StageStatusResult; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const result: StageStatusResult = {}

  if (fetchingId) {
    const { data, error } = await supabase
      .from("fetchinghistory")
      .select("status")
      .eq("fetchingID", fetchingId)
      .single()
    if (error) return { data: result, error }
    result.fetching = data ? String(data.status || '') : null
  }

  if (processingId) {
    const { data, error } = await supabase
      .from("processinghistory")
      .select("status")
      .eq("processingID", processingId)
      .single()
    if (error) return { data: result, error }
    result.processing = data ? String(data.status || '') : null
  }

  if (normalizationId) {
    const { data, error } = await supabase
      .from("normalization_history")
      .select("status")
      .eq("normalizationid", normalizationId)
      .single()
    if (error) return { data: result, error }
    result.normalization = data ? String(data.status || '') : null
  }

  if (refinementId) {
    const { data, error } = await supabase
      .from("refinement_history")
      .select("status")
      .eq("refinementid", refinementId)
      .single()
    if (error) return { data: result, error }
    result.refinement = data ? String(data.status || '') : null
  }

  if (calculationId) {
    const { data, error } = await supabase
      .from("calculation_history")
      .select("status")
      .eq("calculationid", calculationId)
      .single()
    if (error) return { data: result, error }
    result.calculation = data ? String(data.status || '') : null
  }

  return { data: result, error: null }
}
