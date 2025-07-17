"use server"

import { createServerClient } from "@/lib/supabase-server-client"
import type { PostgrestError } from "@supabase/supabase-js"

export interface CalculationHistoryData {
  calculationID: number
  fluxID: number
  status: string
  timestamp: string
  completedAt: string | null
  calculationTimeInSeconds: number | null
  progress: number | null
  numberOfItems: number | null
  errorMessage: string | null
}

export async function getCalculationHistoryById(
  calculationId: number,
): Promise<{ data: CalculationHistoryData | null; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("calculation_history")
    .select("*")
    .eq("calculationid", calculationId)
    .single()
  return { data: data as CalculationHistoryData | null, error }
}
