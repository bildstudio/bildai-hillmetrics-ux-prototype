"use server"

import { createServerClient } from "@/lib/supabase-server-client"
import type { PostgrestError } from "@supabase/supabase-js"

export interface WorkflowStageDetailData {
  id: number
  stage_type: string
  stage_order: number
  status: string
  stage_started: string
  stage_end: string | null
  sub_process_count: number | null
  duration_minutes: number | null
  progress: number | null
  error_message: string | null
}

export async function getWorkflowStageDetails(runId: number): Promise<{
  data: WorkflowStageDetailData[]
  error: PostgrestError | null
}> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("v_workflow_stage_details")
    .select("*")
    .eq("run_id", runId)

  return {
    data: (data as WorkflowStageDetailData[]) || [],
    error,
  }
}
