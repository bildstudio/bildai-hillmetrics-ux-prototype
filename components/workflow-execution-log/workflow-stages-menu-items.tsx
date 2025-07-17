import { LucideIcon, FileText } from "lucide-react"
import { ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import type { WorkflowStageDetailData } from "@/app/actions/workflow-stage-details"

export type WorkflowStageMenuAction = "view"

interface BaseItem {
  type: "item"
  id: WorkflowStageMenuAction
  label: string
  icon: LucideIcon
  disabled?: (item: WorkflowStageDetailData) => boolean
}
interface Separator { type: "separator" }
export type WorkflowStageMenuDefinition = BaseItem | Separator

export const workflowStageMenu: WorkflowStageMenuDefinition[] = [
  { type: "item", id: "view", label: "View", icon: FileText },
]

interface RenderProps {
  item: WorkflowStageDetailData
  onAction: (id: WorkflowStageMenuAction, item: WorkflowStageDetailData) => void
  components: {
    Item: typeof ContextMenuItem | typeof DropdownMenuItem
    Separator: typeof ContextMenuSeparator | typeof DropdownMenuSeparator
  }
}

export function WorkflowStageMenuItems({ item, onAction, components }: RenderProps) {
  const { Item, Separator } = components
  return (
    <>
      {workflowStageMenu.map((el, idx) => {
        if (el.type === "item") {
          const disabled = el.disabled ? el.disabled(item) : false
          const Icon = el.icon
          return (
            <Item key={el.id} onSelect={() => !disabled && onAction(el.id, item)} disabled={disabled}>
              <Icon className="mr-2 h-4 w-4" />
              <span>{el.label}</span>
            </Item>
          )
        }
        return <Separator key={`sep-${idx}`} />
      })}
    </>
  )
}
