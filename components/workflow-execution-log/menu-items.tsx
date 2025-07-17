import { LucideIcon, Eye, History, FileText, FileTextIcon, Edit, Pencil, Zap, Info } from "lucide-react"
import { ContextMenuItem, ContextMenuLabel, ContextMenuSeparator } from "@/components/ui/context-menu"
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import type { WorkflowExecutionLogData } from "@/app/actions/workflow-execution-log"

export type WorkflowMenuAction =
  | "viewWorkflow"
  | "quickFlux"
  | "viewFlux"
  | "editFlux"
  | "renameFlux"
  | "viewFetching"
  | "viewProcessing"
  | "viewNormalization"
  | "viewRefinement"
  | "viewCalculation"
  | "viewContent"
  | "process"
  | "simulateProcess"
  | "createMapping"

interface BaseItem {
  type: "item"
  id: WorkflowMenuAction
  label: string
  icon: LucideIcon
  disabled?: (item: WorkflowExecutionLogData) => boolean
}
interface Separator { type: "separator" }
interface Label { type: "label"; label: string }
export type WorkflowMenuDefinition = BaseItem | Separator | Label

export const workflowMenu: WorkflowMenuDefinition[] = [
  { type: "item", id: "viewWorkflow", label: "View workflow details", icon: FileTextIcon },
  { type: "item", id: "quickFlux", label: "Quick Flux details", icon: Info },
  { type: "separator" },
  { type: "label", label: "Flux managment" },
  { type: "item", id: "viewFlux", label: "View Flux", icon: FileTextIcon },
  { type: "item", id: "editFlux", label: "Edit Flux", icon: Edit },
  { type: "item", id: "renameFlux", label: "Rename Flux", icon: Pencil },
  { type: "separator" },
  { type: "label", label: "Workflow managment" },
  { type: "item", id: "viewFetching", label: "View fetching stage details", icon: Eye, disabled: (i) => !i.fetching_id },
  { type: "item", id: "viewProcessing", label: "View processing stage details", icon: History, disabled: (i) => !i.processing_id },
  { type: "item", id: "viewNormalization", label: "View normalization stage details", icon: FileText, disabled: (i) => !i.normalization_id },
  { type: "item", id: "viewRefinement", label: "View refinement stage details", icon: FileText, disabled: (i) => !i.refinement_id },
  { type: "item", id: "viewCalculation", label: "View calculation stage details", icon: FileText, disabled: (i) => !i.calculation_id },
  { type: "separator" },
  { type: "item", id: "viewContent", label: "View content", icon: FileText },
  { type: "separator" },
  { type: "item", id: "process", label: "Process", icon: Zap, disabled: () => true },
  { type: "item", id: "simulateProcess", label: "Simulate process", icon: Zap, disabled: () => true },
  { type: "item", id: "createMapping", label: "Create mapping", icon: FileText, disabled: () => true },
]

interface RenderProps {
  item: WorkflowExecutionLogData
  includeView?: boolean
  includeQuickFlux?: boolean
  includeFluxManagement?: boolean
  onAction: (id: WorkflowMenuAction, item: WorkflowExecutionLogData) => void
  components: {
    Item: typeof ContextMenuItem | typeof DropdownMenuItem
    Label: typeof ContextMenuLabel | typeof DropdownMenuLabel
    Separator: typeof ContextMenuSeparator | typeof DropdownMenuSeparator
  }
}

export function WorkflowMenuItems({
  item,
  includeView = true,
  includeQuickFlux = true,
  includeFluxManagement = true,
  onAction,
  components,
}: RenderProps) {
  const { Item, Label, Separator } = components

  const filteredMenu = workflowMenu.filter((el) => {
    if (!includeQuickFlux && el.type === "item" && el.id === "quickFlux") {
      return false
    }
    if (!includeFluxManagement) {
      if (el.type === "label" && el.label === "Flux managment") return false
      if (
        el.type === "item" &&
        ["viewFlux", "editFlux", "renameFlux"].includes(el.id)
      )
        return false
    }
    return true
  })

  return (
    <>
      {filteredMenu.map((el, idx) => {
        if (el.type === "item") {
          if (!includeView && el.id === "viewWorkflow") return null
          const disabled = el.disabled ? el.disabled(item) : false
          const Icon = el.icon
          return (
            <Item key={el.id} onSelect={() => !disabled && onAction(el.id, item)} disabled={disabled}>
              <Icon className="mr-2 h-4 w-4" />
              <span>{el.label}</span>
            </Item>
          )
        }
        if (el.type === "separator") return <Separator key={`sep-${idx}`} />
        return (
          <Label key={`label-${idx}`} className="px-2 py-1 text-xs font-semibold text-muted-foreground">
            {el.label}
          </Label>
        )
      })}
    </>
  )
}
