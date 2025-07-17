"use server"

import { createServerClient } from "@/lib/supabase-server-client"
import type { PostgrestError } from "@supabase/supabase-js"

export interface NormalizationHistoryData {
  normalizationID: number
  fluxID: number
  status: string
  timestamp: string
  completedAt: string | null
  normalizationTimeInSeconds: number | null
  progress: number | null
  numberOfItems: number | null
  errorMessage: string | null
}

export async function getNormalizationHistoryById(
  normalizationId: number,
): Promise<{ data: NormalizationHistoryData | null; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("normalization_history")
    .select("*")
    .eq("normalizationid", normalizationId)
    .single()
  return { data: data as NormalizationHistoryData | null, error }
}
