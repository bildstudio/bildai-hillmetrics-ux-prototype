export const WORKFLOW_STAGE_ORDER: Record<string, number> = {
  fetching: 1,
  processing: 2,
  normalization: 3,
  refinement: 4,
  calculation: 5,
}

export function sortWorkflowStages<T extends { stage_type: string; stage_order?: number }>(
  stages: T[],
): T[] {
  return [...stages].sort((a, b) => {
    const av =
      typeof (a as any).stage_order === 'number'
        ? (a as any).stage_order!
        : WORKFLOW_STAGE_ORDER[a.stage_type?.toLowerCase()] ?? Infinity
    const bv =
      typeof (b as any).stage_order === 'number'
        ? (b as any).stage_order!
        : WORKFLOW_STAGE_ORDER[b.stage_type?.toLowerCase()] ?? Infinity
    return av - bv
  })
}
