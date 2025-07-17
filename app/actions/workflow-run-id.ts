"use server"

import { createServerClient } from "@/lib/supabase-server-client"
import type { PostgrestError } from "@supabase/supabase-js"

export async function getRunIdFromStage(
  stageId: number,
  stageType: string
): Promise<{ runId: number | null; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("v_workflow_stage_details")
    .select("run_id")
    .ilike("stage_type", `${stageType}%`)
    .eq("id", stageId)
    .maybeSingle()

  return { runId: data?.run_id ?? null, error }
}
