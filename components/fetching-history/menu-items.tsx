import { LucideIcon, Eye, Info, FileTextIcon, Edit, Pencil, FileText, Zap, History } from "lucide-react"
import { ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import type { FetchingHistoryData } from "@/app/actions/fetching-history"

export type FetchingHistoryMenuAction =
  | "viewDetails"
  | "quickFlux"
  | "viewFlux"
  | "editFlux"
  | "renameFlux"
  | "showMeta"
  | "viewWorkflow"
  | "process"
  | "simulateProcess"
  | "createMapping"
  | "viewContent"
  | "viewProcessings"

interface BaseItem {
  type: "item"
  id: FetchingHistoryMenuAction
  label: string
  icon: LucideIcon
  disabled?: (item: FetchingHistoryData) => boolean
}
interface Separator { type: "separator" }
export type FetchingHistoryMenuDefinition = BaseItem | Separator

export const fetchingHistoryMenu: FetchingHistoryMenuDefinition[] = [
  { type: "item", id: "viewDetails", label: "View details", icon: Eye },
  { type: "item", id: "quickFlux", label: "Quick Flux details", icon: Info },
  { type: "separator" },
  { type: "item", id: "viewFlux", label: "View Flux", icon: FileTextIcon },
  { type: "item", id: "editFlux", label: "Edit Flux", icon: Edit },
  { type: "item", id: "renameFlux", label: "Rename", icon: Pencil },
  { type: "separator" },
  { type: "item", id: "showMeta", label: "Show meta data", icon: FileText, disabled: () => true },
  { type: "item", id: "viewWorkflow", label: "View workflow", icon: FileText, disabled: () => true },
  { type: "item", id: "process", label: "Process", icon: Zap, disabled: () => true },
  { type: "item", id: "simulateProcess", label: "Simulate process", icon: Zap, disabled: () => true },
  { type: "item", id: "createMapping", label: "Create mapping", icon: FileText, disabled: () => true },
  { type: "separator" },
  { type: "item", id: "viewContent", label: "View content", icon: FileText },
  { type: "item", id: "viewProcessings", label: "View processings", icon: History },
]

interface RenderProps {
  item: FetchingHistoryData
  onAction: (id: FetchingHistoryMenuAction, item: FetchingHistoryData) => void
  components: {
    Item: typeof ContextMenuItem | typeof DropdownMenuItem
    Separator: typeof ContextMenuSeparator | typeof DropdownMenuSeparator
  }
}

export function FetchingHistoryMenuItems({ item, onAction, components }: RenderProps) {
  const { Item, Separator } = components
  return (
    <>
      {fetchingHistoryMenu.map((el, idx) => {
        if (el.type === "item") {
          const disabled = el.disabled ? el.disabled(item) : false
          return (
            <Item key={el.id} onSelect={() => !disabled && onAction(el.id, item)} disabled={disabled}>
              <el.icon className="mr-2 h-4 w-4" />
              <span>{el.label}</span>
            </Item>
          )
        }
        return <Separator key={`sep-${idx}`} />
      })}
    </>
  )
}
